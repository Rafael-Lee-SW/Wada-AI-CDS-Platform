// BarChart.js
import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function BarChart() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 'auto', flexDirection: 'column' }}>
            <Plot 
                data={[
                    {
                        x: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],  // x축 레이블
                        y: [20, 14, 23, 25],  // y축 값
                        type: 'bar',  // 막대 그래프 타입 설정
                        marker: { color: 'purple' }  // 막대 색상 설정
                    }
                ]}
                layout={{
                    autosize: true,
                    responsive: true,
                    width: '100%',
                    height: '400px',
                    title: 'Simple Bar Chart',  // 그래프 제목
                    xaxis: { title: 'Categories' },  // x축 제목
                    yaxis: { title: 'Values' },  // y축 제목
                    modebar: {
                        orientation: 'v'
                    }
                }}  
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            />
        </div>
    );
}
