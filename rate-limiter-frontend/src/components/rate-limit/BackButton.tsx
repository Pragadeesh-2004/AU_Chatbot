import React from "react";

type BackButtonProps = {
  onClick: () => void;
};

const BackButton: React.FC<BackButtonProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mr-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
    aria-label="Go back"
  >
    ← Back
  </button>
);

export default BackButton;