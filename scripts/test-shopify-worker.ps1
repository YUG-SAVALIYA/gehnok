param(
  [string]$BaseUrl = "https://gehnok.gehnokjewels.workers.dev",
  [string]$Origin = "https://gehnok.com"
)

$ErrorActionPreference = "Stop"

$script:Failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $script:Failures.Add($Message)
  Write-Host "FAIL $Message" -ForegroundColor Red
}

function Add-Pass {
  param([string]$Message)
  Write-Host "PASS $Message" -ForegroundColor Green
}

function Get-HeaderValue {
  param(
    [Microsoft.PowerShell.Commands.WebResponseObject]$Response,
    [string]$Name
  )

  $value = $Response.Headers[$Name]
  if ($value -is [array]) {
    return ($value -join ", ")
  }
  return $value
}

function Invoke-ShopifyRequest {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [object]$Body = $null,
    [int[]]$AllowedStatus = @(200),
    [switch]$SkipJsonCheck
  )

  $uri = "$BaseUrl$Path"
  $headers = @{
    "Accept" = "application/json"
    "Origin" = $Origin
  }

  $parameters = @{
    Uri = $uri
    Method = $Method
    Headers = $headers
  }

  if ($null -ne $Body) {
    $parameters.ContentType = "application/json"
    $parameters.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
  }

  try {
    $response = Invoke-WebRequest @parameters
  } catch {
    if ($_.Exception.Response) {
      $response = $_.Exception.Response
    } else {
      Add-Failure "${Name}: request failed - $($_.Exception.Message)"
      return $null
    }
  }

  $status = [int]$response.StatusCode
  $contentType = Get-HeaderValue $response "Content-Type"
  $cors = Get-HeaderValue $response "Access-Control-Allow-Origin"
  $workerHeader = Get-HeaderValue $response "X-Gehnok-Worker"
  $bodyText = [string]$response.Content

  if ($AllowedStatus -notcontains $status) {
    Add-Failure "${Name}: unexpected HTTP $status"
  }

  if ($status -eq 404) {
    Add-Failure "${Name}: returned 404"
  }

  if ($bodyText.TrimStart().StartsWith("<!doctype html", [System.StringComparison]::OrdinalIgnoreCase) -or
      $bodyText.TrimStart().StartsWith("<html", [System.StringComparison]::OrdinalIgnoreCase)) {
    Add-Failure "${Name}: returned SPA HTML"
  }

  if (-not $SkipJsonCheck) {
    if (-not ($contentType -like "application/json*")) {
      Add-Failure "${Name}: response is not JSON ($contentType)"
    }
  }

  if (-not $cors) {
    Add-Failure "${Name}: missing CORS header"
  }

  if (-not $workerHeader) {
    Add-Failure "${Name}: missing X-Gehnok-Worker header"
  }

  $json = $null
  if (-not $SkipJsonCheck -and $bodyText) {
    try {
      $json = $bodyText | ConvertFrom-Json
    } catch {
      Add-Failure "${Name}: JSON parse failed"
    }
  }

  if ($script:Failures.Count -eq 0 -or $AllowedStatus -contains $status) {
    Add-Pass "${Name}: HTTP $status"
  }

  return [pscustomobject]@{
    Status = $status
    Headers = $response.Headers
    Json = $json
    Text = $bodyText
  }
}

function Assert-Condition {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if ($Condition) {
    Add-Pass $Message
  } else {
    Add-Failure $Message
  }
}

Write-Host "Testing Shopify Worker at $BaseUrl"

$options = Invoke-ShopifyRequest -Name "OPTIONS products" -Method "OPTIONS" -Path "/api/shopify/products" -AllowedStatus @(204) -SkipJsonCheck

$graphql = Invoke-ShopifyRequest -Name "POST generic GraphQL" -Method "POST" -Path "/api/shopify" -Body @{
  query = "query { shop { name } }"
  variables = @{}
}
Assert-Condition ($graphql.Json.data.shop.name -eq "Gehnok Jewels") "GraphQL shop name is Gehnok Jewels"

$products = Invoke-ShopifyRequest -Name "GET products" -Method "GET" -Path "/api/shopify/products?first=1"
Assert-Condition ($products.Json.products.Count -ge 1) "Products response contains at least one product"

$collections = Invoke-ShopifyRequest -Name "GET collections" -Method "GET" -Path "/api/shopify/collections?first=1"
Assert-Condition ($collections.Json.collections.Count -ge 1) "Collections response contains at least one collection"

$articles = Invoke-ShopifyRequest -Name "GET articles" -Method "GET" -Path "/api/shopify/articles?first=1"
Assert-Condition ($null -ne $articles.Json.articles) "Articles response preserves articles key"

$policies = Invoke-ShopifyRequest -Name "GET policies" -Method "GET" -Path "/api/shopify/policies"
Assert-Condition ($null -ne $policies.Json.shop) "Policies response preserves shop key"

$metalMeta = Invoke-ShopifyRequest -Name "GET metaobject metal_colors/main" -Method "GET" -Path "/api/shopify/metaobjects/metal_colors/main"
Assert-Condition ($metalMeta.Status -ne 404) "metal_colors/main route did not return 404"

$homepageMeta = Invoke-ShopifyRequest -Name "GET metaobject homepage_assets/main" -Method "GET" -Path "/api/shopify/metaobjects/homepage_assets/main"
Assert-Condition ($homepageMeta.Status -ne 404) "homepage_assets/main route did not return 404"

$product = $products.Json.products | Select-Object -First 1
$productHandle = [string]$product.handle
Assert-Condition (-not [string]::IsNullOrWhiteSpace($productHandle)) "Product handle discovered"

if ($productHandle) {
  $detail = Invoke-ShopifyRequest -Name "GET product detail" -Method "GET" -Path "/api/shopify/products/$([uri]::EscapeDataString($productHandle))"
  Assert-Condition ($detail.Json.product.handle -eq $productHandle) "Product detail handle matches"

  $searchTerm = if ($product.title) { [string]$product.title } else { $productHandle }
  $search = Invoke-ShopifyRequest -Name "GET search" -Method "GET" -Path "/api/shopify/search?q=$([uri]::EscapeDataString($searchTerm))&first=1"
  Assert-Condition ($null -ne $search.Json.products) "Search response preserves products key"

  $variant = $product.variants.edges | Select-Object -First 1
  $variantId = [string]$variant.node.id
  $metal = ""
  $size = ""
  foreach ($option in @($variant.node.selectedOptions)) {
    $name = ([string]$option.name).ToLowerInvariant()
    if ($name.Contains("metal") -or $name.Contains("material")) {
      $metal = [string]$option.value
    }
    if ($name.Contains("size")) {
      $size = [string]$option.value
    }
  }

  $variantPath = "/api/shopify/products/$([uri]::EscapeDataString($productHandle))/variant?metal=$([uri]::EscapeDataString($metal))&size=$([uri]::EscapeDataString($size))"
  $variantLookup = Invoke-ShopifyRequest -Name "GET variant resolution" -Method "GET" -Path $variantPath
  Assert-Condition (-not [string]::IsNullOrWhiteSpace($variantLookup.Json.variantId)) "Variant resolution returned a variantId"
}

$collection = $collections.Json.collections | Select-Object -First 1
$collectionHandle = [string]$collection.handle
Assert-Condition (-not [string]::IsNullOrWhiteSpace($collectionHandle)) "Collection handle discovered"

if ($collectionHandle) {
  $collectionProducts = Invoke-ShopifyRequest -Name "GET collection products" -Method "GET" -Path "/api/shopify/collections/$([uri]::EscapeDataString($collectionHandle))/products?first=1"
  Assert-Condition ($null -ne $collectionProducts.Json.products) "Collection products response preserves products key"
}

$cartCreate = Invoke-ShopifyRequest -Name "POST create cart" -Method "POST" -Path "/api/shopify/cart" -Body @{ lines = @() }
$cartId = [string]$cartCreate.Json.cart.id
Assert-Condition (-not [string]::IsNullOrWhiteSpace($cartId)) "Cart creation returned cart id"

if ($cartId) {
  $cartFetch = Invoke-ShopifyRequest -Name "GET cart" -Method "GET" -Path "/api/shopify/cart/$([uri]::EscapeDataString($cartId))"
  Assert-Condition ($cartFetch.Json.cart.id -eq $cartId) "Fetched cart id matches"

  if ($variantId) {
    $cartAdd = Invoke-ShopifyRequest -Name "POST cart lines add" -Method "POST" -Path "/api/shopify/cart/$([uri]::EscapeDataString($cartId))/lines" -Body @{
      lines = @(@{
        merchandiseId = $variantId
        quantity = 1
      })
    } -AllowedStatus @(200, 400)

    if ($cartAdd.Status -eq 200) {
      $line = $cartAdd.Json.cart.lines.edges | Select-Object -First 1
      $lineId = [string]$line.node.id
      Assert-Condition (-not [string]::IsNullOrWhiteSpace($lineId)) "Cart add returned line id"

      if ($lineId) {
        $cartUpdate = Invoke-ShopifyRequest -Name "PATCH cart line quantity" -Method "PATCH" -Path "/api/shopify/cart/$([uri]::EscapeDataString($cartId))/lines/$([uri]::EscapeDataString($lineId))" -Body @{
          quantity = 2
        }
        Assert-Condition ($cartUpdate.Json.cart.totalQuantity -ge 2) "Cart quantity update reflected in cart"

        $cartRemove = Invoke-ShopifyRequest -Name "DELETE cart line" -Method "DELETE" -Path "/api/shopify/cart/$([uri]::EscapeDataString($cartId))/lines/$([uri]::EscapeDataString($lineId))"
        Assert-Condition ($cartRemove.Json.cart.totalQuantity -eq 0) "Cart line removed"
      }
    } else {
      Assert-Condition ($null -ne $cartAdd.Json.error) "Cart add user error returned clearly"
    }
  }

  $discount = Invoke-ShopifyRequest -Name "POST invalid discount" -Method "POST" -Path "/api/shopify/cart/$([uri]::EscapeDataString($cartId))/discount" -Body @{
    discountCodes = @("INVALID-GEHNOK-SMOKE-TEST")
  } -AllowedStatus @(200, 400)
  Assert-Condition (($discount.Json.error -or $discount.Json.cart)) "Invalid discount returned a clear JSON result"
}

if ($script:Failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Smoke test failed with $($script:Failures.Count) failure(s)." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Smoke test passed." -ForegroundColor Green
