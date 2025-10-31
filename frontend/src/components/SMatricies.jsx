import React, { useState } from "react";
import axios from "axios";

const MatricesFetcher = () => {
  const [userField, setUserField] = useState("");
  const [matricesArray, setMatricesArray] = useState(null);

  const getMatrices = async (field) => {
    try {
      const response = await axios.post("http://localhost:5000/api/matrices", {
        specificField: field,
      });
      setMatricesArray(response.data);
    } catch (err) {
      console.error(err);
      alert("Failed to get Matrices.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userField.trim() !== "") {
      getMatrices(userField);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userField}
          onChange={(e) => setUserField(e.target.value)}
          placeholder="Enter a field (e.g., Bodybuilding)"
          className="border p-2 w-full mb-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Get Progress Metrics
        </button>
      </form>

      {matricesArray && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Progress Metrics</h2>
          {Object.entries(matricesArray).map(([category, metrics], index) => (
            <div key={index} className="mb-4">
              <h3 className="text-lg font-semibold">{category}</h3>
              <ul className="list-disc list-inside text-gray-700">
                {metrics.map((metric, i) => (
                  <li key={i}>{metric}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatricesFetcher;
