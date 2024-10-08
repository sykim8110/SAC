var getScriptPromisify = (src) => {
  return new Promise((resolve) => {
    $.getScript(src, resolve)
  })
}

var parseMetadata = metadata => {
  const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata
  const dimensions = []
  for (const key in dimensionsMap) {
    const dimension = dimensionsMap[key]
    dimensions.push({ key, ...dimension })
  }
  const measures = []
  for (const key in measuresMap) {
    const measure = measuresMap[key]
    measures.push({ key, ...measure })
  }
  return { dimensions, measures, dimensionsMap, measuresMap }
}

(function () {
const template = document.createElement('template')
template.innerHTML = `
<style>
</style>
<div id="root" style="width: 100%; height: 100%;">
Hello WebComponent
</div>
`
class Main extends HTMLElement {
	constructor () {
		super()
		this._shadowRoot = this.attachShadow({ mode: 'open' })
		this._shadowRoot.appendChild(template.content.cloneNode(true))
		
		this._root = this._shadowRoot.getElementById('root')
		this._eChart = null;
		this._selectedDataPoint = {}
		
	}
	
	onCustomWidgetResize (width, height) {
		this.render()
    }

    onCustomWidgetAfterUpdate (changedProps) {
		this.render()
    }

    onCustomWidgetDestroy () {
		if (this._eChart && echarts) { echarts.dispose(this._eChart) }
    }
	
	//차트 타입에 대한 파라메터가 변경될때 차트를 새로 표현하기 위한 구문
	setSeriesType (seriesType) {
      this.seriesType = seriesType
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { seriesType } } }))
      this.render()
    }
	
	getSeriesType () {
      return this.seriesType 
    }
	
	getSelectedDataPoint () {
      return this._selectedDataPoint
    }
	
	async render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') {return}
	  
	  await getScriptPromisify('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js')
	  
	  const { data, metadata } = dataBinding
      const { dimensions, measures } = parseMetadata(metadata)
      // dimension
      const categoryData = []

      // measures
      const series = measures.map(measure => {
        return {
          id: measure.id,
          name: measure.label,
          data: [],
          key: measure.key,
          type: this.seriesType || 'line',
          smooth: true
        }
      })

      data.forEach(row => {
        categoryData.push(dimensions.map(dimension => {
          return row[dimension.key].label
        }).join('/')) // dimension
        series.forEach(series => {
          series.data.push(row[series.key].raw)
        }) // measures
      })

      if (this._eChart) { echarts.dispose(this._eChart) }
      const eChart = this._eChart = echarts.init(this._root, 'main')
      const option = {
        xAxis: { type: 'category', data: categoryData },
        yAxis: { type: 'value' },
        tooltip: { trigger: 'axis' },
        series
      }
      eChart.setOption(option)
	  //eChart의 클릭 이벤트
	  eChart.on('click', (params) => {
        // https://echarts.apache.org/en/api.html#events.Mouse%20events
		console.log(["params",params]);
		const {seriesIndex,seriesName,dataIndex,data,name} = params
		this._selectedDataPoint = {seriesIndex,seriesName,dataIndex,data,name}
		//eChart의 클릭 이벤트 시 위젯의 onClick 이벤트와 동일시 함.
        this.dispatchEvent(new Event('onClick'))
      })
    }
}

customElements.define('com-bsg-sac-exercise-sykim-main', Main)
})()