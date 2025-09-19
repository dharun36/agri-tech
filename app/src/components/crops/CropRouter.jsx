import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { FaArrowLeft, FaTasks } from 'react-icons/fa';

/**
 * Component that handles redirection to the appropriate component based on an ID
 * This component helps resolve issues with direct URL access and navigation
 */
const CropRouter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to validate the crop ID
    const validateCropId = async () => {
      try {
        setIsChecking(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        // Try to fetch the crop to validate it exists
        const response = await fetch(`http://localhost:5000/api/crops/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch crop: ${response.status}`);
        }

        // If we get here, the crop exists
        const cropData = await response.json();
        console.log('Crop found:', cropData);

        // Redirect to the actual component with state
        navigate(`/crop-details/${id}`, {
          replace: true,
          state: { cropInitialData: cropData }
        });

      } catch (err) {
        console.error('Error validating crop ID:', err);
        setError(`Crop with ID ${id} not found or could not be loaded.`);
      } finally {
        setIsChecking(false);
      }
    };

    if (id) {
      validateCropId();
    } else {
      setError('No crop ID provided');
      setIsChecking(false);
    }
  }, [id, navigate]);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Locating crop information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-medium">Crop Not Found</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={() => navigate('/home')}
            variant="primary"
            className="w-full"
          >
            <FaArrowLeft className="mr-2" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => navigate('/add-crop')}
            variant="secondary"
            className="w-full"
          >
            <FaTasks className="mr-2" />
            Add New Crop
          </Button>
        </div>
      </div>
    );
  }

  return null; // Should not reach here as we redirect in useEffect
};

export default CropRouter;