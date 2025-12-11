import Script from "next/script";

export default function Bootstrap() {
  return (
    <>
      {/* HTML content ở trên */}

      {/* jQuery core */}
      <Script src="/js/jquery.min.js" strategy="beforeInteractive" />
      <Script src="/js/jquery-migrate-3.0.1.min.js" strategy="beforeInteractive" />

      {/* Bootstrap dependencies */}
      <Script src="/js/popper.min.js" strategy="beforeInteractive" />
      <Script src="/js/bootstrap.min.js" strategy="beforeInteractive" />

      {/* Plugins */}
      <Script src="/js/jquery.easing.1.3.js" strategy="afterInteractive" />
      <Script src="/js/jquery.waypoints.min.js" strategy="afterInteractive" />
      <Script src="/js/jquery.stellar.min.js" strategy="afterInteractive" />
      <Script src="/js/owl.carousel.min.js" strategy="afterInteractive" />
      <Script src="/js/jquery.magnific-popup.min.js" strategy="afterInteractive" />
      <Script src="/js/jquery.animateNumber.min.js" strategy="afterInteractive" />
      <Script src="/js/bootstrap-datepicker.js" strategy="afterInteractive" />
      <Script src="/js/scrollax.min.js" strategy="afterInteractive" />

      {/* Google Map */}
      {/* <Script
        src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&sensor=false"
        strategy="afterInteractive"
      /> */}
      {/* <Script src="/js/google-map.js" strategy="afterInteractive" /> */}

      {/* Custom main.js (chạy cuối cùng) */}
      <Script src="/js/main.js" strategy="afterInteractive" />
    </>
  );
}