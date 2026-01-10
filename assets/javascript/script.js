function redraw() {
  $('#grid').empty();
  $('#cells-foreground').empty();
  $('.annotations-layer').remove(); // Clear previous annotations

  var gs = getInput();
  var cells = buildCells(gs);
  $('#grid').append(cells);
  $('#cells-foreground').append(cells);


  var totalCellWidth = gs.cellWidth + (gs.cellBorder * 2) + (gs.cellSpacing * 2)
  var gridWidthInPx = gs.width * totalCellWidth
  var adjustPadding = gs.cellSpacing * 2

  $('#grid').css('background-color', gs.backgroundColor);
  $('#grid').css('padding',adjustPadding);
  $('#grid').css('border-color', gs.borderColor);
  $('#grid').css('border-width', gs.gridBorder);
  $('#grid').css('width', gridWidthInPx);
  $('#cells-foreground').css('padding',adjustPadding);
  $('#cells-foreground').css('border-width', gs.gridBorder);
  $('#cells-foreground').css('width', gridWidthInPx);
  $('.push').css('width', $('.wrap').css('width'));

  $('#cells-foreground .cell').each(function() {
    $(this).css('background-color', gs.cellForegroundColor);
  });

  // Render annotations
  var annotations = buildAnnotations(gs);
  if (annotations) {
    $('.wrap').append(annotations);
  }

}

function buildCells(gs) {
  var out = '';
  var counter = 0;
  for ( h = 0; h < gs.height; h++) {
    var thisRow = 'gs-row-' + h;
    out += '<div id="' + thisRow + '" style=" height:' + (gs.cellHeight + (gs.cellSpacing * 2) + (gs.cellBorder * 2)) + 'px;">';
    for ( w = 0; w < gs.width; w++) {
      out += '<div class="cell val-' + gs.cells[counter] + ' gs-col-' + w + '" style="background-color:' + gs.cellBackgroundColor + 
      '; border-color:' + gs.borderColor + 
      '; border-width:' + gs.cellBorder + 
      'px; width:' + gs.cellWidth + 
      'px; height:' + gs.cellHeight + 
      'px; margin:' + gs.cellSpacing + 
      'px;">&nbsp;</div>';
      counter++;
    }
    out += '</div>';
  }
  return out;
}

function buildAnnotations(gs) {
  if (!gs.annotations || gs.annotations.length === 0) {
    return '';
  }

  var totalCellWidth = gs.cellWidth + (gs.cellBorder * 2) + (gs.cellSpacing * 2);
  var totalCellHeight = gs.cellHeight + (gs.cellBorder * 2) + (gs.cellSpacing * 2);
  var adjustPadding = gs.cellSpacing * 2;
  var gridWidthInPx = gs.width * totalCellWidth;
  var gridHeightInPx = gs.height * totalCellHeight;

  // SVG positioning and size - extend beyond grid for labels
  var labelMargin = 80;
  var svgLeft = -labelMargin;
  var svgTop = -labelMargin;
  var svgWidth = gridWidthInPx + (adjustPadding * 2) + (labelMargin * 2);
  var svgHeight = gridHeightInPx + (adjustPadding * 2) + (labelMargin * 2);

  // Offset for coordinates within the SVG
  var offsetX = labelMargin;
  var offsetY = labelMargin;

  var out = '<svg class="annotations-layer" style="position: absolute; top: ' + svgTop + 'px; left: ' + svgLeft + 'px; width: ' + svgWidth + 'px; height: ' + svgHeight + 'px; pointer-events: none; z-index: 10; overflow: visible;">';

  gs.annotations.forEach(function(annotation) {
    // Validate coordinates
    if (annotation.x >= gs.width || annotation.y >= gs.height || annotation.x < 0 || annotation.y < 0) {
      return; // Skip invalid annotations
    }

    // Calculate cell center position (relative to grid)
    var cellCenterX = adjustPadding + (annotation.x * totalCellWidth) + (totalCellWidth / 2) + offsetX;
    var cellCenterY = adjustPadding + (annotation.y * totalCellHeight) + (totalCellHeight / 2) + offsetY;

    // Calculate distances to each margin (relative to grid edges)
    var gridLeft = adjustPadding + offsetX;
    var gridRight = gridLeft + gridWidthInPx;
    var gridTop = adjustPadding + offsetY;
    var gridBottom = gridTop + gridHeightInPx;

    var distToLeft = cellCenterX - gridLeft;
    var distToRight = gridRight - cellCenterX;
    var distToTop = cellCenterY - gridTop;
    var distToBottom = gridBottom - cellCenterY;

    var minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    var lineEndX, lineEndY, textX, textY, textAnchor, textBaseline;
    var textOffset = 15; // Distance from grid edge to text
    var lineInset = 10; // How far the line extends into the grid

    // Determine which margin is closest
    if (minDist === distToLeft) {
      // Left margin - line extends past grid edge into margin
      lineEndX = gridLeft - lineInset;
      lineEndY = cellCenterY;
      textX = gridLeft - textOffset;
      textY = cellCenterY;
      textAnchor = 'end';
      textBaseline = 'middle';
    } else if (minDist === distToRight) {
      // Right margin
      lineEndX = gridRight + lineInset;
      lineEndY = cellCenterY;
      textX = gridRight + textOffset;
      textY = cellCenterY;
      textAnchor = 'start';
      textBaseline = 'middle';
    } else if (minDist === distToTop) {
      // Top margin
      lineEndX = cellCenterX;
      lineEndY = gridTop - lineInset;
      textX = cellCenterX;
      textY = gridTop - textOffset;
      textAnchor = 'middle';
      textBaseline = 'auto';
    } else {
      // Bottom margin
      lineEndX = cellCenterX;
      lineEndY = gridBottom + lineInset;
      textX = cellCenterX;
      textY = gridBottom + textOffset;
      textAnchor = 'middle';
      textBaseline = 'hanging';
    }

    // Draw line
    out += '<line x1="' + cellCenterX + '" y1="' + cellCenterY + '" x2="' + lineEndX + '" y2="' + lineEndY + '" stroke="' + gs.borderColor + '" stroke-width="1.5" stroke-dasharray="4,4" />';

    // Draw text with background for better readability
    out += '<text x="' + textX + '" y="' + textY + '" font-family="monospace" font-size="11" fill="' + gs.borderColor + '" text-anchor="' + textAnchor + '" dominant-baseline="' + textBaseline + '" style="font-weight: 600;">' + annotation.description + '</text>';
  });

  out += '</svg>';
  return out;
}

function getInput() {
  gs = {};
  var rawInput = $('.gs-input').val();

  // Parse annotations first (before splitting by whitespace)
  gs.annotations = [];
  var annotationRegex = /x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)\s*,\s*"([^"]*)"/gi;
  var match;
  while ((match = annotationRegex.exec(rawInput)) !== null) {
    gs.annotations.push({
      x: Number(match[1]),
      y: Number(match[2]),
      description: match[3]
    });
  }

  // Remove annotations from input before processing grid parameters
  var cleanedInput = rawInput.replace(annotationRegex, '');

  gsInput = cleanedInput.split(/\s*[\s,]\s*/)
  gs.width = Number(gsInput[0])
  gs.height = Number(gsInput[1])
  gs.backgroundColor = gsInput[2]
  gs.cellForegroundColor = gsInput[3]
  gs.cellBackgroundColor = gsInput[4]
  gs.borderColor = gsInput[5]
  gs.cellWidth = Number(gsInput[6])
  gs.cellHeight = Number(gsInput[7])
  gs.cellSpacing = Number(gsInput[8])
  gs.gridBorder = Number(gsInput[9])
  gs.cellBorder = Number(gsInput[10])
  gsInput.splice(0,11)
  // Filter out empty strings that may result from annotation removal
  gs.cells = gsInput.filter(function(val) { return val !== ''; })
  return gs
}

$('.gs-input').bind('input propertychange', function () {
  redraw()
});

$(function() {
  $('.gs-input').val($('pre#default').html());
  redraw()
});