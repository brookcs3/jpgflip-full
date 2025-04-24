const Footer = () => {
  return (
    <footer className="bg-white mt-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 pt-6 flex flex-col items-center">
          <p className="text-sm text-gray-500">AVIFlip - Privacy-first, browser-based conversion</p>
          <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} AVIFlip. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
