// TableChart.js
import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Table() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', flexDirection: 'column' }}>

            <Plot 
                data={[
                    {
                        type: 'table',
                        header: {
                            values: [["<b>Column 1</b>"], ["<b>Column 2</b>"], ["<b>Column 3</b>"]],
                            align: "center",
                            line: {width: 1, color: 'black'},
                            fill: {color: "grey"},
                            font: {family: "Arial", size: 12, color: "white"}
                        },
                        cells: {
                            values: [
                                ["Row 1", "Row 2", "Row 3", "Row 4"],  // Column 1 values
                                [10, 20, 30, 40],                    // Column 2 values
                                [50, 60, 70, 80]                     // Column 3 values
                            ],
                            align: "center",
                            line: {color: "black", width: 1},
                            fill: {color: ['white', 'lightgrey']},
                            font: {family: "Arial", size: 11, color: ["black"]}
                        }
                    }
                ]}
                layout={{
                    autosize: true,
                    responsive: true,
                    title: 'Simple Table Chart',
                    width: '100%',
                    height: 400,
                    modebar: {
                        orientation: 'v',
                    }
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            />
        </div>
    );
}
