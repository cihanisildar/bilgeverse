interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

export default function Loading({ fullScreen = false, message }: LoadingProps) {
  const content = (
    <div className="text-center">
      <div className="text-2xl font-bold mb-4">Bilgeder</div>
      <div className="w-full flex items-center justify-center">
        <div className="loader"></div>
      </div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}

