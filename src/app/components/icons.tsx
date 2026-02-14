import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c-5 0-9-4.5-9-10 0-5.5 4-10 9-10s9 4.5 9 10" />
      <path d="M12 2a7 7 0 0 0-7 7c0 4.5 3 8.5 7 12.5 4-4 7-8 7-12.5a7 7 0 0 0-7-7z" />
      <path d="M12 11a2 2 0 0 0 4 0c0-1.1-.9-2-2-2a2 2 0 0 0-2 2z" />
    </svg>
  );
}
