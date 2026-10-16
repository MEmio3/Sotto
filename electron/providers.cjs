const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { buildInstructions, RESPONSE_SCHEMA, parseResult, safeBaseUrl } = require('./core.cjs');

async function request(url, init = {}, signal, timeout = 90000) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout) });
  if (!response.ok) {
    const code = response.status;
    const messages = { 400: 'The provider rejected this request. Check the model and audio support.', 401: 'Your credentials expired or were rejected. Reconnect in Connections.', 403: 'This account does not have access to that model or service.', 404: 'That model or API endpoint was not found. Refresh the model list.', 413: 'This recording is too large for the provider. Try a shorter recording.', 429: 'The provider usage limit was reached. Wait for the quota to reset or choose another connection.' };
    // Do not surface raw upstream bodies; they can echo credentials or dictated content.
    const error = new Error(messages[code] || `The provider returned HTTP ${code}. Try again shortly.`); error.status = code; throw error;
  }
  return response;
}
function geminiText(data) {
  const result = data.response || data;
  if (result.promptFeedback?.blockReason) throw new Error('The provider declined this recording. It was preserved for retry.');
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason && !['STOP', 'FINISH_REASON_UNSPECIFIED'].includes(candidate.finishReason)) throw new Error(`The provider did not finish the dictation (${candidate.finishReason}). Try a shorter recording.`);
  return candidate?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('') || '';
}
async function geminiGenerate(connection, key, parts, instructions, signal) {
  const base = safeBaseUrl(connection.baseUrl || 'https://generativelanguage.googleapis.com/v1beta');
  const model = connection.model.replace(/^models\//, '');
  const response = await request(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA } })
  }, signal);
  return geminiText(await response.json());
}
async function compatibleGenerate(connection, key, text, instructions, signal) {
  const response = await request(`${safeBaseUrl(connection.baseUrl)}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model: connection.model, stream: false, temperature: 0.1, max_tokens: 8192, messages: [{ role: 'system', content: instructions }, { role: 'user', content: text }] })
  }, signal);
  const data = await response.json(); const choice = data.choices?.[0];
  if (choice?.finish_reason && choice.finish_reason !== 'stop') throw new Error('The provider did not finish the dictation. Retry with a shorter recording.');
  return choice?.message?.content || '';
}
async function transcribeCompatible(connection, key, bytes, signal) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'audio/wav' }), 'dictation.wav');
  form.append('model', connection.transcriptionModel || 'whisper-1');
  form.append('response_format', 'json');
  const response = await request(`${safeBaseUrl(connection.baseUrl)}/audio/transcriptions`, { method: 'POST', headers: key ? { Authorization: `Bearer ${key}` } : {}, body: form }, signal);
  const data = await response.json();
  if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('No speech was returned by the transcription service. Check its model and microphone.');
  return data.text;
}
async function transcribeLocal(settings, filename, signal) {
  if (!settings.whisperExecutable || !settings.whisperModel) throw new Error('Choose your whisper.cpp executable and model in Settings, or use provider transcription.');
  return new Promise((resolve, reject) => {
    const base = filename.replace(/\.wav$/, '-transcript');
    const child = spawn(settings.whisperExecutable, ['-m', settings.whisperModel, '-f', filename, '-oj', '-of', base, '-l', 'auto', '-np'], { windowsHide: true, shell: false, stdio: 'ignore' });
    const stop = () => child.kill(); signal?.addEventListener('abort', stop, { once: true });
    const timer = setTimeout(() => { child.kill(); reject(new Error('Local transcription timed out. Use a smaller model or shorter recording.')); }, 180000);
    child.on('error', () => { clearTimeout(timer); signal?.removeEventListener('abort', stop); reject(new Error('Could not start whisper.cpp. Check the executable path in Settings.')); });
    child.on('close', code => {
      clearTimeout(timer); signal?.removeEventListener('abort', stop);
      const output = `${base}.json`;
      try {
        if (signal?.aborted) throw new Error('Dictation cancelled.');
        if (code !== 0) throw new Error('Local transcription failed. Check the model and executable in Settings.');
        const data = JSON.parse(fs.readFileSync(output, 'utf8'));
        const text = data.transcription?.map(s => s.text).join(' ').trim();
        if (!text) throw new Error('No speech was detected by the local model.');
        resolve(text);
      } catch (e) { reject(e); } finally { if (fs.existsSync(output)) fs.unlinkSync(output); }
    });
  });
}
async function models(connection, secret, google) {
  if (connection.type === 'antigravity') return google.models(secret, connection.id);
  const base = safeBaseUrl(connection.baseUrl || 'https://generativelanguage.googleapis.com/v1beta');
  const response = await request(`${base}/models`, { headers: connection.type === 'gemini' ? { 'x-goog-api-key': secret.apiKey } : secret.apiKey ? { Authorization: `Bearer ${secret.apiKey}` } : {} }, null, 20000);
  const data = await response.json();
  if (connection.type === 'gemini') return (data.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent') && !/image|tts|live|embedding/i.test(m.name)).map(m => ({ id: m.name.replace(/^models\//, ''), name: m.displayName || m.name }));
  return (data.data || []).map(m => ({ id: m.id, name: m.id }));
}
async function generate({ connection, secret, settings, override, bytes, filename, text, signal, onStage, onTranscript, google }) {
  const instructions = buildInstructions(settings, override);
  let transcript = text;
  if (!text && (settings.transcription === 'local' || connection.type === 'compatible')) {
    onStage('transcribing');
    transcript = settings.transcription === 'local' ? await transcribeLocal(settings, filename, signal) : await transcribeCompatible(connection, secret.apiKey, bytes, signal);
    onTranscript?.(transcript);
  }
  onStage('polishing');
  let raw;
  const parts = transcript ? [{ text: `DICTATION DATA:\n${transcript}` }] : [{ inlineData: { mimeType: 'audio/wav', data: bytes.toString('base64') } }, { text: 'Transcribe and rewrite this recording according to the dictation rules.' }];
  if (connection.type === 'gemini') raw = await geminiGenerate(connection, secret.apiKey, parts, instructions, signal);
  else if (connection.type === 'compatible') raw = await compatibleGenerate(connection, secret.apiKey, `DICTATION DATA:\n${transcript}`, instructions, signal);
  else raw = await google.generate(connection, secret, parts, instructions, signal);
  const result = parseResult(raw);
  if (transcript) result.transcript = transcript.trim();
  return result;
}
module.exports = { request, geminiText, models, generate, geminiGenerate, compatibleGenerate };
