import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserAuth } from "../store/userAuthStore";
import { matrixAuthStore } from "../store/matrixStore";
const MatricesDashboard = ({ userId }) => {
  const {matrices,fetchMatrices,updateMetric,deleteMatrix,addCustom,addCustomToGeneral,}=matrixAuthStore()
  // const [matrices, setMatrices] = useState([]);
  const {authUser}=UserAuth()
  const [newMatrix, setNewMatrix] = useState({
    userId:authUser._id,
    username:authUser.username,
    category:"",
    matrices:''


  })


  useEffect(() => {
    fetchMatrices(userId);
  }, []);

  // const fetchMatrices = async () => {
  //   // const type="general"
  //   const res = await axios.get(`http://localhost:5000/api/matrices/${userId}`);
  //   setMatrices(res.data);
  // };

  // const updateMetric = async (matrixId, name, value) => {
  //   await axios.put("http://localhost:5000/api/matrices/update", {
  //     matrixId,
  //     metricName: name,
  //     newValue: value
  //   });
  //   fetchMatrices(); // refresh
  // };

  // const addCustom = async (matrixId, name) => {
  //   await axios.post("http://localhost:5000/api/matrices/add-custom", {
  //     matrixId,
  //     metricName: name
  //   });
  //   fetchMatrices();
  // };

  return (
    <div className="p-4 ">
      {matrices?.map((matrix) => (
        <div key={matrix._id} className="mb-6 border p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">{matrix.category} <span onClick={()=>deleteMatrix(matrix._id,userId)}>Delete</span> </h2>
          {matrix.metrics.map((metric) => (
            <div key={metric.name} className="flex items-center gap-2 mb-1">
              <span>{metric.name}:</span>
              <input
                type="number"
                value={metric.value}
                onChange={(e) => updateMetric( userId,matrix._id, metric.name, e.target.value)}
                className="border px-2 py-1 w-20"
              />
            </div>
          ))}
          <div className="mt-2">
            <input
              type="text"
              placeholder="New Custom Metric"
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom(userId,matrix._id, e.target.value);
                // e.target.value=''
              }}
              className="border px-2 py-1"
            />
          </div>
        </div>
      ))}
      <div className="border p-4 gap-4 flex flex-col w-1/2">
       <form
  onSubmit={(e) => {
    e.preventDefault();
    // Add any needed validation here
    addCustomToGeneral({
      ...newMatrix,
      matrices: newMatrix.matrices.trim(), // optional, safe to clean
    });
  }}
>
  <input
    type="text"
    name="category"
    className="border"
    onChange={(e) =>
      setNewMatrix((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }
    placeholder="Category..."
  />
  <input
    type="text"
    name="matrices"
    className="border"
    onChange={(e) =>
      setNewMatrix((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }
    placeholder="Comma-separated metrics..."
  />
  <button type="submit">Save</button>
</form>

      </div>

    </div>
  );
};

export default MatricesDashboard;
