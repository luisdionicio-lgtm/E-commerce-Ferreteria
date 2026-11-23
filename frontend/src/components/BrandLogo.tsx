export default function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <svg className="brand-mark" viewBox="0 0 46 52" role="img">
        <path className="brand-shield-outer" d="M23 1 43 12 40 40 23 51 3 40 6 12Z" />
        <path
          className="brand-shield-inner"
          d="M23 5 38.5 14 36.4 36.5 23 45.4 8.4 36.5 10.6 14Z"
        />
        <path
          className="brand-shield-accent"
          d="M23 2.2 7.3 12.8 4.4 39.1 23 49.4"
          fill="none"
          stroke="#ff6b00"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="brand-shield-letter"
          d="M14.2 13.5h19l-1 6.7H22.3l-.6 4.2h8.8l-.9 6.2h-8.8l-1.2 9h-7.4Z"
        />
      </svg>
      <span className="brand-wordmark">
        <span className="brand-ferre">Ferre</span>
        <span className="brand-max">Max</span>
      </span>
    </span>
  );
}
