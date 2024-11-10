import React, { useState } from 'react';
import styles from '/styles/fileUploaderStyle';

export default function FileUploader({ onChangePage, onSubmitFiles }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(''); 
  // 파일 추가 핸들러
  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);

    if (files.length + fileArray.length > 2) {
      setError('파일은 최대 2개까지 업로드 가능합니다.');
      return;
    }
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
    setError('');
  };

  // 드래그 앤 드롭 영역에서 파일을 드롭할 때
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // 파일 선택 핸들러 (input type="file" 사용)
  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
  };

  // 드래그 상태 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileRemove = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleFileSubmit = (files) => {
    if (files.length > 0) {
      onSubmitFiles(files); 
      onChangePage('requirementUploader'); 
    }
  }

  return (
    <div style={styles.container}>
        <div>
        {error && (
            <div style={styles.error}>{error}</div>
        )}
        <form
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onSubmit={(e) => e.preventDefault()}
            style={{
            border: '2px dashed #9370db',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#d3d3d3' : '#f0f0f0',
            }}
        >
            <input
            type="file"
            id="file-input"
            multiple
            style={styles.input}
            onChange={handleFileSelect}
            // accept=".csv"
            />
            <label htmlFor="file-input" style={styles.label}>
            {dragActive ? (
                <p style={styles.text}>여기에 놓아주세요.</p>
            ) : (
                <p style={styles.text}>분석할 파일을 드래그하거나 선택해주세요.</p>
            )}
            </label>
            {files.length > 0 && (
            <div style={styles.fileDisplay}>
                <div style={styles.files}>
                    {files.map((file, index) => (
                    <div key={index} style={styles.file}>
                        <span style={styles.fileName}>{file.name}</span>
                        <button
                            type="button"
                            onClick={() => handleFileRemove(index)}
                            style={styles.removeButton}
                        >
                            X
                        </button>
                    </div>
                    ))}
                </div>
            </div>
            )}
        </form>

        {files.length > 0 && (
            <div style={styles.buttonContainer}>
                <button style={styles.button} onClick={() => handleFileSubmit(files)}>
                    선택 완료
                </button>
            </div>
            )}
        </div>
    </div>
  );
}
