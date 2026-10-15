# Builds index.html from index.src.html by inlining <!-- @include path --> partials.
# Usage (from the voiden folder):  powershell -ExecutionPolicy Bypass -File tools\build.ps1
$root = Split-Path -Parent $PSScriptRoot
$src = [IO.File]::ReadAllText((Join-Path $root 'index.src.html'), [Text.Encoding]::UTF8)
$out = [regex]::Replace($src, '<!--\s*@include\s+([^\s]+)\s*-->', {
  param($m)
  $p = Join-Path $root $m.Groups[1].Value
  if (Test-Path -LiteralPath $p) { [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8).TrimEnd() }
  else { "<!-- missing: $($m.Groups[1].Value) -->" }
})
[IO.File]::WriteAllText((Join-Path $root 'index.html'), $out, (New-Object Text.UTF8Encoding $false))
Write-Output "built index.html ($($out.Length) chars)"
