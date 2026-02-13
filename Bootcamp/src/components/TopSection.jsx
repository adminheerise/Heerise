import React from 'react'

function TopSection() {
  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Section - Image */}
          <div className="w-full h-[600px] lg:h-[700px] relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="Team collaboration in modern office"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Section - Content */}
          <div className="w-full flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-12 lg:py-16">
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              <span className="relative inline-block">
                <span className="relative">
                  ID/LXD
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                </span>
                <span className="ml-2">Career Lab</span>
              </span>
            </h1>

            {/* Tag */}
            <div className="mb-6">
              <span className="inline-block bg-blue-200 text-white px-5 py-2 rounded-full text-sm font-medium">
                Founding Cohort · Starts Feb 28 · 8-Week Intensive
              </span>
            </div>

            {/* Description */}
            <div className="mb-8 space-y-4 text-gray-700 leading-relaxed">
              <p className="text-base sm:text-lg">
                An elite 8-week bootcamp for professionals who want to break into Learning Experience Design (LXD)/ Instructional Design (ID).
              </p>
              <p className="text-base sm:text-lg">
                Build a portfolio with five hands-on projects, get 1:1 mentorship, and receive job-ready application coaching.
              </p>
            </div>

            {/* Features/Stats */}
            <div className="grid grid-cols-2 gap-6 mb-10">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">8 Weeks</h3>
                <p className="text-sm text-gray-500">Intensive Training</p>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">5 Projects</h3>
                <p className="text-sm text-gray-500">Portfolio Pieces</p>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">1:1</h3>
                <p className="text-sm text-gray-500">Mentorship</p>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">Weekly</h3>
                <p className="text-sm text-gray-500">Live Sessions + Office Hours</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 flex items-center justify-center group">
                APPLY FOR COHORT 1
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 rounded-lg transition-colors duration-200">
                VIEW PROJECTS
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TopSection
