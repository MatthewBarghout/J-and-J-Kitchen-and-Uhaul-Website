import React from "react";
import Logo from "./logo.png";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex flex-col justify-between px-4 py-10">
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-10 text-center border border-green-100">
          <img
            src={Logo}
            alt="J and J Kitchen Logo"
            className="h-36 w-auto mx-auto mb-6 rounded-xl border-4 border-green-700 shadow"
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-800 tracking-tight mb-4">
            J and J Kitchen & U-Haul
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-6">
            Family-owned since 2015, we serve hand-breaded Southern fried chicken, homestyle sides,
            and warm hospitality right here in the heart of the community.
          </p>
          <p className="text-sm text-gray-500 italic mb-8">
            Open 11:00 AM – 6:00 PM 
          </p>
          <Link
            to="/menu"
            className="inline-block px-6 py-3 bg-green-600 text-white text-lg rounded-full shadow hover:bg-green-700 transition"
          >
            See Menu & Order
          </Link>
        </div>
      </div>

      <footer className="mt-10 text-center text-sm text-gray-600">
        <p className="mb-2">📞 (336) 283-9609</p>
        <div className="flex justify-center space-x-6 mb-4">
          <a
            href="https://www.facebook.com/jandjfoodmart/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-700 transition"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/jandjkitchenandfood/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-700 transition"
          >
            Instagram
          </a>
        </div>
        <p className="text-gray-700 font-medium">2022 S Broad St, Winston-Salem, NC 27127</p>
      </footer>
    </div>
  );
}

export default HomePage;



