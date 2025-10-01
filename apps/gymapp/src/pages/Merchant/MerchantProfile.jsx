// src/pages/Merchant/MerchantProfile.jsx
import React from "react";

export default function MerchantProfile() {
  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-teal-400">Merchant Profile</h1>
        <p className="text-gray-400 mt-2">
          Manage your merchant profile, products, and store details.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 mb-8">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-teal-600 to-cyan-700 rounded-t-2xl relative">
          <button className="absolute top-4 right-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 px-4 py-2 rounded-xl text-sm font-medium shadow-md">
            Edit Profile
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 relative -mt-12 flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full border-4 border-gray-900 shadow-lg overflow-hidden">
            <img
              src="https://via.placeholder.com/150"
              alt="Merchant"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">FlexiFit Store</h2>
            <p className="text-gray-400 mt-2 leading-relaxed max-w-2xl">
              Premium fitness supplements, sportswear, and training accessories
              for all your workout needs. We focus on quality and trust.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mt-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-teal-400">120+</div>
                <div className="text-gray-400">Products</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-teal-400">4.8 ★</div>
                <div className="text-gray-400">Store Rating</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-teal-400">2 yrs</div>
                <div className="text-gray-400">Experience</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Store Info */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-teal-400 mb-4">Store Information</h3>
          <ul className="space-y-3 text-gray-300">
            <li><span className="font-medium text-white">Store Name:</span> FlexiFit Store</li>
            <li><span className="font-medium text-white">Email:</span> merchant@example.com</li>
            <li><span className="font-medium text-white">Phone:</span> +91 98765 43210</li>
            <li><span className="font-medium text-white">Location:</span> Bengaluru, India</li>
          </ul>
        </div>

        {/* Categories */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-teal-400 mb-4">Categories</h3>
          <div className="flex flex-wrap gap-3">
            {["Supplements", "Sportswear", "Equipment", "Accessories", "Gifts"].map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 bg-gray-700 text-teal-400 rounded-xl text-sm font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
