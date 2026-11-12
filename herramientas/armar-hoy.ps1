# Baja la agenda oficial de la Ciudad de Buenos Aires (linda.buenosaires.gob.ar) y arma data/hoy.json
# con los eventos puntuales de los próximos días, para la sección "Hoy en Buenos Aires" (tarjeta #65).
#
# Se usa una vez por día. Funciona en Windows PowerShell 5.1 y en PowerShell 7 (el de GitHub Actions).
#   powershell -ExecutionPolicy Bypass -File herramientas/armar-hoy.ps1 -out app/data/hoy.json
#
# Qué deja afuera:
# - (Desde la tarjeta de la agenda ampliada) las muestras y ciclos con muchas fechas SÍ entran, marcados con "serie", y la guía los muestra después de los eventos puntuales.
# - Eventos sin coordenadas o fuera de la Ciudad.
# Qué guarda de cada evento: título, fecha y hora, lugar, dirección, barrio, ubicación, si es gratis y el enlace a la página oficial.
# No guarda descripciones ni fotos: la página oficial es la fuente, y cada evento enlaza ahí.
param([string]$out = "app/data/hoy.json", [int]$dias = 3, [int]$maxFechas = 10)
$ErrorActionPreference = "Stop"
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$base = "https://linda.buenosaires.gob.ar"
$resp = Invoke-WebRequest -Uri "$base/api/frontend/events/filter?page=1&limit=500" -UseBasicParsing -TimeoutSec 90 -Headers @{ Accept = "application/json" }
$texto = [Text.Encoding]::UTF8.GetString($resp.RawContentStream.ToArray())
$datos = $texto | ConvertFrom-Json
if (-not $datos.events) { throw "La agenda no devolvió eventos." }

$ahora = [DateTime]::UtcNow
$desde = $ahora.AddHours(-3)
$hasta = $ahora.AddDays($dias)

# Barrios: vienen como "san_nicolas"; se escriben como se ven en la guía.
$fix = @{ "nunez" = "Núñez"; "san_nicolas" = "San Nicolás"; "constitucion" = "Constitución"; "san_cristobal" = "San Cristóbal"; "agronomia" = "Agronomía"; "velez_sarsfield" = "Vélez Sarsfield"; "villa_gral_mitre" = "Villa General Mitre"; "parque_chacabuco" = "Parque Chacabuco" }
$ti = (Get-Culture).TextInfo
function Barrio($b) {
  if (-not $b) { return "" }
  if ($fix.ContainsKey($b)) { return $fix[$b] }
  return $ti.ToTitleCase(($b -replace "_", " "))
}
function Enlace($e) {
  $p = $e.pathAlias
  if (-not $p -and $e.slug) { $p = "/eventos/" + $e.slug }
  if (-not $p) { return "$base/agenda" }
  if ($p -match "^https?://") { return $p }
  $p = $p -replace "^/descubrir/", "/eventos/"   # la ruta vieja ya no existe
  return $base + $p
}

$lista = New-Object System.Collections.ArrayList
foreach ($e in $datos.events) {
  $fechas = @($e.fechasDelEvento | Where-Object { $_ })
  if ($fechas.Count -eq 0 -and $e.fechaInicio) { $fechas = @($e.fechaInicio) }
  if ($fechas.Count -eq 0) { continue }
  $serie = $fechas.Count -gt $maxFechas   # muestras y ciclos: se muestran, pero después de los eventos puntuales
  $dur = 0
  if ($e.fechaInicio -and $e.fechaFin) { try { $dur = ([DateTime]::Parse([string]$e.fechaFin, [Globalization.CultureInfo]::InvariantCulture) - [DateTime]::Parse([string]$e.fechaInicio, [Globalization.CultureInfo]::InvariantCulture)).TotalMinutes } catch { $dur = 0 } }
  $u = $e.ubicacion
  if (-not $u -or -not $u.latitud -or -not $u.longitud) { continue }
  $lat = [double]$u.latitud; $lng = [double]$u.longitud
  if ($lat -gt -34.52 -or $lat -lt -34.71 -or $lng -gt -58.33 -or $lng -lt -58.54) { continue }   # fuera de la Ciudad
  foreach ($f in $fechas) {
    $ini = ([DateTime]::Parse([string]$f, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal))
    if ($ini -lt $desde -or $ini -gt $hasta) { continue }
    $dir = if ($u.direccion) { $u.direccion } else { $e.direccion }
    if ($dir) { $dir = ($dir -split ",")[0].Trim() }
    [void]$lista.Add([ordered]@{
      t = ([string]$e.title).Trim()
      ini = $ini.ToString("yyyy-MM-ddTHH:mm:ssZ")
      lugar = [string]$u.titulo
      dir = [string]$dir
      barrio = Barrio $e.barrio
      ll = @([Math]::Round($lat, 5), [Math]::Round($lng, 5))
      url = Enlace $e
      gratis = ($e.acceso -eq "sin_costo")
      fin = $(if ($dur -gt 0 -and $dur -le 720) { $ini.AddMinutes($dur).ToString("yyyy-MM-ddTHH:mm:ssZ") } else { "" })
      serie = $serie
    })
  }
}
$orden = @($lista | Sort-Object { $_.ini })
$doc = [ordered]@{
  actualizado = $ahora.ToString("yyyy-MM-ddTHH:mm:ssZ")
  fuente = "Agenda oficial de la Ciudad de Buenos Aires (linda.buenosaires.gob.ar). Contenido del Gobierno de la Ciudad; cada evento enlaza a su página."
  eventos = $orden
}
$json = $doc | ConvertTo-Json -Depth 6 -Compress
$dirOut = Split-Path -Parent $out
if ($dirOut -and -not (Test-Path $dirOut)) { New-Item -ItemType Directory -Path $dirOut | Out-Null }
[IO.File]::WriteAllText((Join-Path (Get-Location) $out), $json, (New-Object Text.UTF8Encoding($false)))
Write-Host ("Listo: " + $orden.Count + " eventos puntuales entre hoy y los próximos " + $dias + " días, de " + @($datos.events).Count + " de la agenda.")
