import dynamic from 'next/dynamic';

// dynamic import를 사용해 클라이언트 측에서만 로드
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function PlotPage() {
  return (
    <div style={{
        width: '100%', 
        height: 'auto', 
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column',
        marginTop: '50px'
    }}>
      <Plot style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}
        data={[
          {
            x: [1, 2, 3, 4],
            y: [10, 15, 13, 17],
            type: 'scatter',
            mode: 'markers',
            marker: { color: 'red' },
          },
          {
            x: [1, 2, 3, 4],
            y: [16, 5, 11, 9],
            type: 'scatter',
            mode: 'markers+lines',
            marker: { color: 'blue' },
          },
        ]}
        layout={{
          autosize: true,
          responsive: true,
          width: '100%',
          height: '100%',
          title: 'A Simple Plot',
          modebar: {
            orientation: 'v',  // 'h'는 수평, 'v'는 수직
            bgcolor: 'rgba(255, 255, 255, 0.8)',  // 아이콘 배경색
            color: 'black',  // 아이콘 색상
            activecolor: 'blue',  // 아이콘이 활성화될 때 색상
          },
        }}
      />
    </div>
  );
}
