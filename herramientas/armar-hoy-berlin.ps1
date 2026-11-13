# Baja la agenda cultural abierta de Berlín (kulturdaten.berlin, datos de los calendarios de los distritos)
# y arma data/hoy-berlin.json con los eventos con horario de hoy y los próximos días, para la sección "Hoy en Berlín" (tarjeta #99).
# Mismo formato que data/hoy.json (ver herramientas/armar-hoy.ps1).
#
# Se usa una o dos veces por día. Funciona en Windows PowerShell 5.1 y en PowerShell 7 (el de GitHub Actions).
#   powershell -ExecutionPolicy Bypass -File herramientas/armar-hoy-berlin.ps1 -out app/data/hoy-berlin.json
#
# Qué deja afuera:
# - Eventos sin horario (son muestras o actividades de todo el día: no se sabe cuándo mostrarlos).
# - Eventos sin página web propia: la guía solo muestra eventos que enlazan a su fuente.
# - Eventos cancelados o en lugares virtuales.
# Qué guarda de cada evento: título (en alemán, como viene), fecha y hora, lugar, dirección, distrito, si es gratis y el enlace.
# No guarda descripciones ni fotos.
param([string]$out = "app/data/hoy-berlin.json", [int]$dias = 2, [int]$pausaMs = 120)
$ErrorActionPreference = "Stop"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$base = "https://api-v2.kulturdaten.berlin/api"
function Bajar($ruta) {
  $r = Invoke-WebRequest -Uri "$base$ruta" -UseBasicParsing -TimeoutSec 60 -Headers @{ Accept = "application/json" }
  $t = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
  return ($t | ConvertFrom-Json)
}
# Hora de Berlín: el nombre de la zona cambia entre Windows y Linux.
$tz = $null
foreach ($n in @("Europe/Berlin", "W. Europe Standard Time")) { try { $tz = [TimeZoneInfo]::FindSystemTimeZoneById($n); break } catch {} }
if (-not $tz) { throw "No se encontró la zona horaria de Berlín." }

$ahora = [DateTime]::UtcNow
$hoyLocal = [TimeZoneInfo]::ConvertTimeFromUtc($ahora, $tz).Date
$desde = $ahora.AddHours(-3)

# 1. Eventos de cada día (la agenda devuelve hasta 500 por página).
$eventos = New-Object System.Collections.ArrayList
for ($d = 0; $d -le $dias; $d++) {
  $dia = $hoyLocal.AddDays($d).ToString("yyyy-MM-dd")
  $pag = 1
  while ($true) {
    $r = Bajar "/events?startDate=$dia&endDate=$dia&pageSize=500&page=$pag"
    $lote = @($r.data.events)
    foreach ($e in $lote) { [void]$eventos.Add($e) }
    if ($lote.Count -lt 500 -or $pag -ge 5) { break }
    $pag++
  }
}
if ($eventos.Count -eq 0) { throw "La agenda no devolvió eventos." }

# 2. De cada evento con horario, se busca su actividad (título y web) y su lugar (nombre, dirección, distrito).
$actividades = @{}; $lugares = @{}
function Actividad($id) {
  if (-not $actividades.ContainsKey($id)) {
    try { $actividades[$id] = (Bajar "/attractions/$id").data.attraction } catch { $actividades[$id] = $null }
    Start-Sleep -Milliseconds $pausaMs
  }
  return $actividades[$id]
}
function Lugar($id) {
  if (-not $lugares.ContainsKey($id)) {
    try { $lugares[$id] = (Bajar "/locations/$id").data.location } catch { $lugares[$id] = $null }
    Start-Sleep -Milliseconds $pausaMs
  }
  return $lugares[$id]
}

# Solo distritos céntricos: la agenda trae también actividades de barrio de las afueras (bibliotecas, centros vecinales).
$centro = @("Mitte", "Friedrichshain-Kreuzberg", "Pankow", "Charlottenburg-Wilmersdorf", "Tempelhof-Schöneberg", "Neukölln")
$fuera = "(?i)beratung|sprechstunde|digital-zebra|hausaufgaben|computerhilfe|smartphone|onleihe|anmeldung|sprachcaf"
$lista = New-Object System.Collections.ArrayList
$vistos = @{}
foreach ($e in $eventos) {
  if ($e.status -ne "event.published" -or $e.scheduleStatus -ne "event.scheduled") { continue }
  $s = $e.schedule
  if (-not $s -or -not $s.startDate -or -not $s.startTime -or $s.startTime -eq "00:00:00") { continue }   # sin horario
  if ($vistos.ContainsKey($e.identifier)) { continue }
  $vistos[$e.identifier] = $true
  $local = [DateTime]::ParseExact($s.startDate + " " + $s.startTime, "yyyy-MM-dd HH:mm:ss", [Globalization.CultureInfo]::InvariantCulture)
  $ini = [TimeZoneInfo]::ConvertTimeToUtc([DateTime]::SpecifyKind($local, [DateTimeKind]::Unspecified), $tz)
  if ($ini -lt $desde) { continue }
  $fin = ""
  if ($s.endTime -and $s.endTime -ne "00:00:00" -and $s.endDate -eq $s.startDate) {
    $finLocal = [DateTime]::ParseExact($s.endDate + " " + $s.endTime, "yyyy-MM-dd HH:mm:ss", [Globalization.CultureInfo]::InvariantCulture)
    if ($finLocal -gt $local -and ($finLocal - $local).TotalMinutes -le 720) { $fin = [TimeZoneInfo]::ConvertTimeToUtc([DateTime]::SpecifyKind($finLocal, [DateTimeKind]::Unspecified), $tz).ToString("yyyy-MM-ddTHH:mm:ssZ") }
  }
  $aRef = @($e.attractions)[0]; $lRef = @($e.locations)[0]
  if (-not $aRef -or -not $lRef) { continue }
  $a = Actividad $aRef.referenceId
  if (-not $a) { continue }
  $web = [string]$a.website
  if ($web -notmatch "^https://") { continue }   # la guía solo muestra eventos con enlace seguro a su fuente
  $titulo = ([string]$a.title.de).Trim()
  if (-not $titulo) { $titulo = ([string]$a.title.en).Trim() }
  if (-not $titulo) { continue }
  $l = Lugar $lRef.referenceId
  if (-not $l -or $l.isVirtual) { continue }
  if ($centro -notcontains [string]$l.borough) { continue }   # solo distritos céntricos, los que recorre un viajero
  if ($titulo -match $fuera) { continue }   # trámites y ayudas de biblioteca: no son planes
  $clave = ($titulo -replace "[^\p{L}\p{N}]", "").ToLower() + "|" + $l.title.de + "|" + $ini.ToString("o")
  if ($vistos.ContainsKey($clave)) { continue }   # el mismo evento cargado por dos distritos
  $vistos[$clave] = $true
  [void]$lista.Add([ordered]@{
    t = $titulo
    ini = $ini.ToString("yyyy-MM-ddTHH:mm:ssZ")
    lugar = ([string]$l.title.de).Trim()
    dir = [string]$l.address.streetAddress
    barrio = [string]$l.borough
    url = $web
    gratis = ($e.admission -and $e.admission.ticketType -eq "ticketType.freeOfCharge")
    fin = $fin
    serie = $false
  })
}
$orden = @($lista | Sort-Object { $_.ini })
$doc = [ordered]@{
  actualizado = $ahora.ToString("yyyy-MM-ddTHH:mm:ssZ")
  fuente = "Agenda cultural abierta de Berlín (kulturdaten.berlin, calendarios de los distritos). Cada evento enlaza a la página de quien lo organiza."
  eventos = $orden
}
$json = $doc | ConvertTo-Json -Depth 6 -Compress
$dirOut = Split-Path -Parent $out
if ($dirOut -and -not (Test-Path $dirOut)) { New-Item -ItemType Directory -Path $dirOut | Out-Null }
[IO.File]::WriteAllText((Join-Path (Get-Location) $out), $json, (New-Object Text.UTF8Encoding($false)))
Write-Host ("Listo: " + $orden.Count + " eventos con horario y enlace entre hoy y los próximos " + $dias + " días, de " + $eventos.Count + " de la agenda.")
