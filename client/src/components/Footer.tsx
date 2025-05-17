import { Link } from "wouter";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">ReviewReplier</h3>
            <p className="text-gray-600 mb-4">
              AI-powered customer review response generator for businesses.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-600 hover:text-blue-600">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/dashboard">
                  <a className="text-gray-600 hover:text-blue-600">Dashboard</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-gray-600">
              Have questions? Need help?<br />
              Contact our support team.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-gray-600">
            &copy; {currentYear} ReviewReplier. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
