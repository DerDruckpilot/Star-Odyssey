local sprite = app.activeSprite

if not sprite then
  error("No active sprite open.")
end

local cel = app.activeCel or sprite.cels[1]
if not cel then
  error("No active cel found.")
end

if cel.layer.isBackground then
  app.command.LayerFromBackground()
  cel = app.activeCel or sprite.cels[1]
end

local image = cel.image
local width = image.width
local height = image.height
local pixelColor = app.pixelColor
local transparent = pixelColor.rgba(0, 0, 0, 0)

local brightnessThreshold = tonumber(app.params.brightness or "236")
local saturationThreshold = tonumber(app.params.saturation or "14")
local edgeBrightnessThreshold = tonumber(app.params.edgeBrightness or "244")
local edgeSaturationThreshold = tonumber(app.params.edgeSaturation or "18")

local function rgbaComponents(pixel)
  return pixelColor.rgbaR(pixel), pixelColor.rgbaG(pixel), pixelColor.rgbaB(pixel), pixelColor.rgbaA(pixel)
end

local function colorSpread(r, g, b)
  local highest = math.max(r, g, b)
  local lowest = math.min(r, g, b)
  return highest - lowest, (r + g + b) / 3
end

local function isBackgroundPixel(pixel, avgThreshold, spreadThreshold)
  local r, g, b, a = rgbaComponents(pixel)
  if a == 0 then
    return false
  end

  local spread, average = colorSpread(r, g, b)
  return average >= avgThreshold and spread <= spreadThreshold
end

local queue = {}
local head = 1
local visited = {}

local function enqueue(x, y)
  if x < 0 or y < 0 or x >= width or y >= height then
    return
  end

  local key = y * width + x
  if visited[key] then
    return
  end

  if not isBackgroundPixel(image:getPixel(x, y), brightnessThreshold, saturationThreshold) then
    return
  end

  visited[key] = true
  queue[#queue + 1] = { x = x, y = y }
end

for x = 0, width - 1 do
  enqueue(x, 0)
  enqueue(x, height - 1)
end

for y = 0, height - 1 do
  enqueue(0, y)
  enqueue(width - 1, y)
end

app.transaction(function()
  while head <= #queue do
    local point = queue[head]
    head = head + 1

    image:drawPixel(point.x, point.y, transparent)

    for offsetY = -1, 1 do
      for offsetX = -1, 1 do
        if not (offsetX == 0 and offsetY == 0) then
          enqueue(point.x + offsetX, point.y + offsetY)
        end
      end
    end
  end

  for y = 0, height - 1 do
    for x = 0, width - 1 do
      local pixel = image:getPixel(x, y)
      local _, _, _, alpha = rgbaComponents(pixel)

      if alpha > 0 and isBackgroundPixel(pixel, edgeBrightnessThreshold, edgeSaturationThreshold) then
        local touchesTransparency = false

        for offsetY = -1, 1 do
          for offsetX = -1, 1 do
            if not (offsetX == 0 and offsetY == 0) then
              local nextX = x + offsetX
              local nextY = y + offsetY

              if nextX < 0 or nextY < 0 or nextX >= width or nextY >= height then
                touchesTransparency = true
              else
                local _, _, _, nextAlpha = rgbaComponents(image:getPixel(nextX, nextY))
                if nextAlpha == 0 then
                  touchesTransparency = true
                end
              end
            end
          end
        end

        if touchesTransparency then
          image:drawPixel(x, y, transparent)
        end
      end
    end
  end
end)
