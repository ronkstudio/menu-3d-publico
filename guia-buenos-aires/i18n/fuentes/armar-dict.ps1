# Junta las listas en español con las traducciones de un idioma y arma i18n/dict/<idioma>.js.
# Controla que cada lista traducida tenga el mismo orden y la misma cantidad que la lista en español.
param([string]$lang, [string]$trad, [string]$out)
$enc = New-Object Text.UTF8Encoding($false)
function Leer($f) { if (Test-Path $f) { [IO.File]::ReadAllLines($f, $enc) } }
function Esc($s) { return '"' + $s.Replace('\', '\\').Replace('"', '\"') + '"' }
$d = New-Object 'System.Collections.Specialized.OrderedDictionary'
$problemas = 0
function Numeradas($nombre) {
    $k = @(Leer (Join-Path $trad "$nombre.txt") | Where-Object { $_.Length -gt 0 })
  $t = @(Leer (Join-Path $trad "$lang.$nombre.txt") | Where-Object { $_.Length -gt 0 })
  if ($t.Count -eq 0) { Write-Host "$nombre : sin traducir"; return }
  if ($t.Count -ne $k.Count) { Write-Host "$nombre : CANTIDAD DISTINTA ($($t.Count) de $($k.Count))"; $script:problemas++ }
  $n = 0
  for ($i = 0; $i -lt $t.Count; $i++) {
    $p = $t[$i].IndexOf('|')
    if ($p -lt 1 -or [int]$t[$i].Substring(0, $p) -ne ($i + 1)) { Write-Host "$nombre : numero mal en la linea $($i + 1)"; $script:problemas++; break }
    $v = $t[$i].Substring($p + 1)
    if ($v.Length -gt 0 -and $i -lt $k.Count -and -not $d.Contains($k[$i])) { $d.Add($k[$i], $v); $n++ }
  }
  Write-Host "$nombre : $n"
}
Numeradas "ui"
Numeradas "extra"
Numeradas "desc"
Numeradas "tip"
$tk = @(Leer (Join-Path $trad "tags.txt") | Where-Object { $_.Length -gt 0 })
$tf = Join-Path $trad "$lang.tags.pipe"
if (Test-Path $tf) {
  $tt = ([IO.File]::ReadAllText($tf, $enc)).Trim().Split('|')
  if ($tt.Count -ne $tk.Count) { Write-Host "tags : CANTIDAD DISTINTA ($($tt.Count) de $($tk.Count))"; $problemas++ }
  else { $n = 0; for ($i = 0; $i -lt $tk.Count; $i++) { if (-not $d.Contains($tk[$i])) { $d.Add($tk[$i], $tt[$i]); $n++ } }; Write-Host "tags : $n" }
}
$rk = @(Leer (Join-Path $trad "re.txt") | Where-Object { $_.Length -gt 0 })
$rt = @(Leer (Join-Path $trad "$lang.re.txt") | Where-Object { $_.Length -gt 0 })
if ($rt.Count -ne $rk.Count) { Write-Host "reglas : CANTIDAD DISTINTA ($($rt.Count) de $($rk.Count))"; $problemas++ }
$sb = New-Object Text.StringBuilder
[void]$sb.Append("/* Diccionario '$lang'. Se arma solo a partir de las listas de traduccion: no editar a mano los textos largos sin revisar la clave.`n   Clave: texto en espanol tal como se ve en la app. Valor: traduccion. */`nwindow.I18N_FULL = {`n")
foreach ($key in $d.Keys) { [void]$sb.Append((Esc $key) + ": " + (Esc $d[$key]) + ",`n") }
[void]$sb.Append('"__re": [' + "`n")
$lin = @()
for ($i = 0; $i -lt [Math]::Min($rk.Count, $rt.Count); $i++) { $lin += "[" + (Esc $rk[$i]) + ", " + (Esc $rt[$i]) + "]" }
[void]$sb.Append(($lin -join ",`n") + "`n]`n};`n")
[IO.File]::WriteAllText($out, $sb.ToString(), $enc)
Write-Host "total: $($d.Count) textos, $($lin.Count) reglas, problemas: $problemas"
