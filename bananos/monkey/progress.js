
function loadChart() {
  var chartWidth, chartHeight;
  var margin;
  const count = d3.select('#count');
  const svg = d3.select('#progress').append('svg');
  const chartLayer = svg.append('g').classed('chartLayer', true);

  d3.json(url, resizeAndDrawChart);

  function createData(progress) {
    const progressEntries = Object.entries(progress);
    
    var totalScore = 0;
    
    const data = {};
    for (const [name, values] of progressEntries) {
      data[name] = [];
      

      // first add an arc from 0 to the start time.
      const startDataElt = {};
      startDataElt.name = name;
      startDataElt.value = values[0].endTs;
      data[name].push(startDataElt);
      
      // console.log(name,'start',JSON.stringify(startDataElt));
      
      var lastTs = 0;
      var lastScore = 0;
      values.forEach(function (value) {
        const dataElt = {};
        dataElt.name = value.score;
        dataElt.score = value.score;
        dataElt.value = value.endTs - lastTs;
        data[name].push(dataElt);
        // console.log(name,'mid',JSON.stringify(dataElt));
        
        lastTs = value.endTs - lastTs;
        lastScore = value.score;
      });
      
      // finally add an arc from the end time to 1.
      const endDataElt = {};
      endDataElt.name = '';
      endDataElt.value = 1.0 - lastTs;
      data[name].push(endDataElt);
      
      totalScore += lastScore;
      
      // console.log(name,'end',JSON.stringify(endDataElt));
    }
    
    count.html('Number of entries : ' + progressEntries.length + ' Total Score : ' + totalScore);
    
    return data;
  }
  
  function resizeAndDrawChart(progress) {
      setSize();
      const data = createData(progress);
      drawChart(data);
  }

  function mixColors(color_1, color_2, weight) {
    function d2h(d) { return d.toString(16); }  // convert a decimal value to hex
    function h2d(h) { return parseInt(h, 16); } // convert a hex value to decimal

    weight = (typeof(weight) !== 'undefined') ? weight : 50; // set the weight to 50%, if that argument is omitted

    var color = '#';

    for(var i = 0; i <= 5; i += 2) { // loop through each of the 3 hex pairs—red, green, and blue
      var v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
          v2 = h2d(color_2.substr(i, 2)),
          
          // combine the current pairs from each source color, according to the specified weight
          val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0))); 

      while(val.length < 2) { val = '0' + val; } // prepend a '0' if val results in a single digit
      
      color += val; // concatenate val to our new color string
    }
      
    return color; // PROFIT!
  };
  
  function getExpectedValueImageSize() {
    if(width < height) {
      return width - 30;
    } else {
      if(screen.width > 600) {
        return 600;
      } else {
        return height - 30;
      }
    }
  };
  
  function setSize() {
      margin = {
          top: 40,
          left: 0,
          bottom: 40,
          right: 0
      };

      const expectedValueImageSize = getExpectedValueImageSize();
      
      chartWidth = expectedValueImageSize - (margin.left + margin.right);
      chartHeight = expectedValueImageSize - (margin.top + margin.bottom);

      svg.attr('width', expectedValueImageSize).attr('height', expectedValueImageSize);

      chartLayer
          .attr('width', chartWidth)
          .attr('height', chartHeight)
          .attr('transform', 'translate(' + [margin.left + (chartWidth / 2), margin.top + (chartHeight / 2)] + ')');
  }

  function drawChart(dataList) {
      var laneNbr = 1;
      const dataEntries = Object.entries(dataList);
      const pie = d3.pie().sort(null).value(function(d) {return d.value;});

      const dataKeys = [];
      
      var maxScore = 0;
      const maxScoreByName = {};
      for (const [name, values] of dataEntries) {
        values.forEach(function (value) {
          if(value.score > maxScore)  {
            maxScore = value.score;
          }
          if((maxScoreByName[name] == undefined) || (value.score > maxScoreByName[name])) {
            maxScoreByName[name] = value.score;
          }
        });
      }
      
      for (const [name, values] of dataEntries) {
          dataKeys.push(name);
      }
      
      const laneWidth = (chartHeight / (dataKeys.length + 1)) / 2;

      dataKeys.sort(function(a, b){
          return dataList[a].length - dataList[b].length
        });
      
      dataKeys.forEach(function(name) {
        const values = dataList[name];
          const innerRadius = laneWidth * laneNbr;
          const outerRadius = laneWidth * (laneNbr + 1);

          const arc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
          
          const labelArc = d3.arc().outerRadius(outerRadius).innerRadius(innerRadius);
          
          const newBlock = chartLayer.selectAll('g').data(pie(values)).enter()

          // https://github.com/d3/d3-scale-chromatic
          var sequentialScale = d3.scaleSequential()
            .domain([0, maxScore])
            .interpolator(d3.interpolateInferno).clamp(true);
          
          newBlock.append('path')
              .attr('d', arc)
              .attr('id', function(d, i) {
                  return 'arc-' + name + '-' + i
              })
              .attr('stroke', 'rgba(0, 0, 0, 0)')
              .attr('fill', function(d, i) {
                if(d.data.score == undefined) {
                  return 'white';
                } else {
                  // console.log(i,d.data.score,colorLinearScale(d.data.score));
                  const color = sequentialScale(d.data.score).substring(1);
                  const mixedColor = mixColors(color, 'FFFFFF');
                  // console.log('color',d.data.score,color,mixedColor);
                  return mixedColor;
                }
              })

              /*
          newBlock.append('text')
            .attr('transform', function(d) { return 'translate(' + labelArc.centroid(d) + ')'; })
            .attr('dy', '.35em')
            .attr('stroke', 'rgba(0, 0, 0, 0.15)')
            .style('font-size', '9px')
            .text(function(d) { return d.data.name; });
          */
          laneNbr++;
      });
  }
};