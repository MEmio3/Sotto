$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -ReferencedAssemblies System.Windows.Forms -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
public static class SottoDesktop {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool GetGUIThreadInfo(uint thread, ref GUITHREADINFO info);
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
  [DllImport("user32.dll", SetLastError=true)] static extern uint SendInput(uint n, INPUT[] input, int size);
  [DllImport("user32.dll")] static extern uint GetClipboardSequenceNumber();
  [StructLayout(LayoutKind.Sequential)] struct RECT { public int a,b,c,d; }
  [StructLayout(LayoutKind.Sequential)] struct GUITHREADINFO {
    public int cbSize; public uint flags; public IntPtr active, focus, capture, menu, move, caret; public RECT caretRect;
  }
  [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public UNION data; }
  [StructLayout(LayoutKind.Explicit)] struct UNION {
    [FieldOffset(0)] public KEYBDINPUT keyboard;
    [FieldOffset(0)] public MOUSEINPUT mouse;
  }
  [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT { public ushort vk, scan; public uint flags, time; public UIntPtr extra; }
  [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT { public int x,y; public uint mouseData, flags, time; public UIntPtr extra; }
  public static long[] Capture() {
    IntPtr window=GetForegroundWindow(); uint pid; uint thread=GetWindowThreadProcessId(window,out pid);
    GUITHREADINFO info=new GUITHREADINFO(); info.cbSize=Marshal.SizeOf(info); GetGUIThreadInfo(thread,ref info);
    return new long[]{window.ToInt64(),info.focus.ToInt64(),pid};
  }
  public static string Insert(long window,long focus,string text) {
    if(text.Length>60000) return "Text is too long for automatic insertion. Copy it from Sotto.";
    long[] current=Capture();
    if(current[0]!=window || (focus!=0 && current[1]!=focus)) return "The active textbox changed. Your text is ready to copy in Sotto.";
    int[] modifiers={0x10,0x11,0x12,0x5B,0x5C};
    foreach(int key in modifiers) if((GetAsyncKeyState(key)&0x8000)!=0) return "Release the modifier keys, then copy your text from Sotto.";
    DataObject snapshot=new DataObject();
    try {
      IDataObject previous=Clipboard.GetDataObject();
      if(previous!=null) foreach(string format in previous.GetFormats(false)) {
        object value=previous.GetData(format,false);
        if(value!=null) snapshot.SetData(format,false,value);
      }
    } catch { return "The clipboard is busy. Your text is ready to copy in Sotto."; }
    uint sequence=0;
    try {
      Clipboard.SetText(text,TextDataFormat.UnicodeText);
      sequence=GetClipboardSequenceNumber();
      current=Capture();
      if(current[0]!=window || (focus!=0 && current[1]!=focus)) return "The active textbox changed. Your text is ready to copy in Sotto.";
      INPUT[] input=new INPUT[4];
      for(int i=0;i<4;i++) input[i].type=1;
      input[0].data.keyboard.vk=0x11;
      input[1].data.keyboard.vk=0x56;
      input[2].data.keyboard.vk=0x56; input[2].data.keyboard.flags=2;
      input[3].data.keyboard.vk=0x11; input[3].data.keyboard.flags=2;
      if(SendInput(4,input,Marshal.SizeOf(typeof(INPUT)))!=4) return "Windows blocked insertion. Copy your text from Sotto.";
      // Paste preserves line breaks without sending an Enter key to the target.
      Thread.Sleep(450);
    } catch { return "Windows could not paste the text. Copy it from Sotto."; }
    finally {
      // Never overwrite a newer clipboard value placed there by the user.
      if(sequence!=0 && GetClipboardSequenceNumber()==sequence) {
        try { if(snapshot.GetFormats(false).Length==0) Clipboard.Clear(); else Clipboard.SetDataObject(snapshot,true); } catch { }
      }
    }
    return "";
  }
}
'@
[Console]::Out.WriteLine('{"ready":true}')
[Console]::Out.Flush()
while ($null -ne ($line = [Console]::In.ReadLine())) {
  $request = $null
  try {
    $request = $line | ConvertFrom-Json
    if ($request.command -eq 'capture') {
      $target = [SottoDesktop]::Capture()
      $reply = @{ id=$request.id; window=$target[0]; focus=$target[1]; pid=$target[2] }
    } elseif ($request.command -eq 'insert') {
      $problem = [SottoDesktop]::Insert([long]$request.window,[long]$request.focus,[string]$request.text)
      $reply = @{ id=$request.id; ok=($problem -eq ''); error=$problem }
    } else { throw 'Unknown desktop command.' }
    [Console]::Out.WriteLine(($reply | ConvertTo-Json -Compress))
  } catch { [Console]::Out.WriteLine((@{id=$request.id;ok=$false;error='Desktop input failed. Copy the result from Sotto.'} | ConvertTo-Json -Compress)) }
  [Console]::Out.Flush()
}
