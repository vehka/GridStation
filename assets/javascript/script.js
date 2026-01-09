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

  var svgWidth = gridWidthInPx + (adjustPadding * 2) + 200; // Extra space for labels
  var svgHeight = gridHeightInPx + (adjustPadding * 2) + 200;

  var out = '<svg class="annotations-layer" style="position: absolute; top: 0; left: 0; width: ' + svgWidth + 'px; height: ' + svgHeight + 'px; pointer-events: none; z-index: 1000;">';

  gs.annotations.forEach(function(annotation) {
    // Validate coordinates
    if (annotation.x >= gs.width || annotation.y >= gs.height || annotation.x < 0 || annotation.y < 0) {
      return; // Skip invalid annotations
    }

    // Calculate cell center position
    var cellCenterX = adjustPadding + (annotation.x * totalCellWidth) + (totalCellWidth / 2);
    var cellCenterY = adjustPadding + (annotation.y * totalCellHeight) + (totalCellHeight / 2);

    // Calculate distances to each margin
    var distToLeft = cellCenterX;
    var distToRight = gridWidthInPx + (adjustPadding * 2) - cellCenterX;
    var distToTop = cellCenterY;
    var distToBottom = gridHeightInPx + (adjustPadding * 2) - cellCenterY;

    var minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    var lineEndX, lineEndY, textX, textY, textAnchor, textBaseline;

    // Determine which margin is closest
    if (minDist === distToLeft) {
      // Left margin
      lineEndX = 5;
      lineEndY = cellCenterY;
      textX = 5;
      textY = cellCenterY;
      textAnchor = 'start';
      textBaseline = 'middle';
    } else if (minDist === distToRight) {
      // Right margin
      lineEndX = gridWidthInPx + (adjustPadding * 2) + 5;
      lineEndY = cellCenterY;
      textX = lineEndX + 5;
      textY = cellCenterY;
      textAnchor = 'start';
      textBaseline = 'middle';
    } else if (minDist === distToTop) {
      // Top margin
      lineEndX = cellCenterX;
      lineEndY = 5;
      textX = cellCenterX;
      textY = 5;
      textAnchor = 'middle';
      textBaseline = 'hanging';
    } else {
      // Bottom margin
      lineEndX = cellCenterX;
      lineEndY = gridHeightInPx + (adjustPadding * 2) + 5;
      textX = cellCenterX;
      textY = lineEndY + 5;
      textAnchor = 'middle';
      textBaseline = 'hanging';
    }

    // Draw line
    out += '<line x1="' + cellCenterX + '" y1="' + cellCenterY + '" x2="' + lineEndX + '" y2="' + lineEndY + '" stroke="' + gs.borderColor + '" stroke-width="1" stroke-dasharray="3,3" />';

    // Draw text
    out += '<text x="' + textX + '" y="' + textY + '" font-family="monospace" font-size="12" fill="' + gs.borderColor + '" text-anchor="' + textAnchor + '" dominant-baseline="' + textBaseline + '">' + annotation.description + '</text>';
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
  gs.cells = gsInput
  return gs
}

$('.gs-input').bind('input propertychange', function () {
  redraw()
});

$(function() {
  $('.gs-input').val($('pre#default').html());
  redraw()
});