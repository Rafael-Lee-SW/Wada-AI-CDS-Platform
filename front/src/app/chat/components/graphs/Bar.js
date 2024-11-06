import React, { useEffect } from 'react';
import * as echarts from 'echarts';

export default function Bar({ graph }) {
    useEffect(() => {
        const chartDom = document.getElementById('feature_importance_chart');
        if (!chartDom) {
            console.error('Chart DOM element not found');
            return;
        }
        
        const chart = echarts.init(chartDom);

        // 중요도를 내림차순 정렬 후 상위 10개만 선택
        const data = graph.feature_names
            .map((name, index) => ({
                name: name,
                value: parseFloat(graph.feature_importances[index].toFixed(2))
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const option = {
            title: {
                text: graph.title || 'Feature Importances',
                subtext: '중요도',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}'
            },
            xAxis: {
                type: 'value',
                name: '중요도',
            },
            yAxis: {
                type: 'category',
                data: data.map(item => item.name).reverse(),
                name: '특성',
                inverse: true,
                axisLabel: {
                    formatter: function(value) {
                        return value.length > 10 ? value.slice(0, 10) + '...' : value; // 이름 길이 줄임
                    },
                    fontSize: 12, // 폰트 크기 조절
                    interval: 0, // 모든 라벨 표시
                    lineHeight: 15 // 줄 간격 조절
                }
            },
            series: [{
                type: 'bar',
                data: data,
                label: {
                    show: true,
                    position: 'right',
                    valueAnimation: true
                }
            }]
        };

        chart.setOption(option);

        return () => {
            chart.dispose();
        };
    }, [graph]);

    return (
        <div id="feature_importance_chart" style={{ width: '100%', height: '400px' }}></div>
    );
}
