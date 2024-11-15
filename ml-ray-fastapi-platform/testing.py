import pandas as pd

df = pd.read_csv("https://s3.ap-northeast-2.amazonaws.com/wadada-bucket/304efd3f-416c-46e8-891a-a92d85afab85.csv")
unique_classes = df['Termd'].unique()
print(f"타겟 변수 'Termd'의 고유 클래스: {unique_classes}")
print(f"데이터셋의 크기: {df.shape}")

