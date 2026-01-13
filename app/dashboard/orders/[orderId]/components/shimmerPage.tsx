export const PageShimmer = () => {
  
  return (
    <div className="min-h-screen bg-gray-300 p-6 space-y-6 animate-pulse">
      
      {/* Title */}
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>

      {/* Header Buttons */}
      <div className="flex gap-3">
        <div className="h-10 w-28 bg-gray-200 rounded"></div>
        <div className="h-10 w-20 bg-gray-200 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Side */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-10"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
