# Minimal static file server for local preview (no Node needed).
# Usage: powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 5510]
param([int]$Port = 5510)
$root = Split-Path -Parent $PSScriptRoot
$types = @{ '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8';
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.mp4' = 'video/mp4'; '.woff2' = 'font/woff2'; '.ico' = 'image/x-icon' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving $root at http://localhost:$Port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($rel -eq '') { $rel = 'index.html' }
    $path = Join-Path $root ($rel -replace '/', '\')
    if ((Test-Path -LiteralPath $path -PathType Leaf) -and ([IO.Path]::GetFullPath($path).StartsWith($root))) {
      $ext = [IO.Path]::GetExtension($path).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $bytes = [IO.File]::ReadAllBytes($path)
      $range = $ctx.Request.Headers['Range']
      if ($range -and $range -match 'bytes=(\d+)-(\d*)') {
        $start = [long]$matches[1]; $end = if ($matches[2]) { [long]$matches[2] } else { $bytes.Length - 1 }
        $len = $end - $start + 1
        $res.StatusCode = 206
        $res.Headers.Add('Accept-Ranges', 'bytes')
        $res.Headers.Add('Content-Range', "bytes $start-$end/$($bytes.Length)")
        $res.ContentLength64 = $len
        $res.OutputStream.Write($bytes, [int]$start, [int]$len)
      } else {
        $res.Headers.Add('Accept-Ranges', 'bytes')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else { $res.StatusCode = 404 }
  } catch { try { $res.StatusCode = 500 } catch {} }
  finally { try { $res.OutputStream.Close() } catch {} }
}
