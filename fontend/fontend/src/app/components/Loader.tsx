export default function Loader() {
  return (
   <div id="ftco-loader" className="show fullscreen">
  <svg className="circular" width="48px" height="48px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <circle
      className="path-bg"
      cx="24"
      cy="24"
      r="22"
      fill="none"
      strokeWidth="4"
      stroke="#eeeeee"
    />
    <circle
      className="path"
      cx="24"
      cy="24"
      r="22"
      fill="none"
      strokeWidth="4"
      strokeMiterlimit="10"
      stroke="#F96D00"
    />
  </svg>
</div>
  );
}
