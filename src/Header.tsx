import React from "react";

const Header: React.FC = () => {
  return (
    <header className="shadow-lg border-b-2 border-gray-300 max-h-[300px]">
      <div className="container mx-auto flex items-center p-4">
        <img src="/Group.png" alt="Logotipo da empresa" className="h-12" />
      </div>
    </header>
  );
};

export default Header;
