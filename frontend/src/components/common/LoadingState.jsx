function LoadingState({ label = 'Loading...', fullScreen = false }) {
  return (
    <div className={fullScreen ? 'loading-screen loading-screen-full' : 'loading-screen'}>
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export default LoadingState;
