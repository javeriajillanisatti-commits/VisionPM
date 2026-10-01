import os
from flask import Flask, request, jsonify
from waitress import serve
import joblib

app = Flask(__name__)

# Load the trained model once (path is relative to this file, not the working directory)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "task_delay_model.pkl"))

priority_map = {
    "Low": 0,
    "Medium": 1,
    "High": 2,
}


# Prepare features and predict task delay
def make_prediction(task):
    priority = priority_map.get(task.get("priority", "Medium"), 1)
    workload = float(task.get("workload", 0))
    progress = float(task.get("progress", 0))
    time_left = float(task.get("time_left", 0))

    features = [[priority, workload, progress, time_left]]
    prediction = int(model.predict(features)[0])

    confidence = None
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features)[0]
        confidence = round(float(max(probabilities)) * 100, 2)

    return {
        "prediction": prediction,
        "result": "Delayed" if prediction == 1 else "Not Delayed",
        "confidence": confidence,
    }


# Health check (used by hosting platforms)
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# Predict delay for a single task
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No task data provided",
            }), 400

        return jsonify({
            "success": True,
            **make_prediction(data),
        }), 200

    except Exception as error:
        print("Single prediction error:", error)
        return jsonify({
            "success": False,
            "message": str(error),
        }), 500


# Predict delay for multiple tasks
@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided",
            }), 400

        tasks = data.get("tasks", [])

        if not isinstance(tasks, list):
            return jsonify({
                "success": False,
                "message": "Tasks must be provided as a list",
            }), 400

        if not tasks:
            return jsonify({
                "success": True,
                "totalTasks": 0,
                "results": [],
            }), 200

        results = []

        for task in tasks:
            task_id = task.get("taskId")
            task_name = task.get(
                "taskName",
                task.get("name", "Untitled Task"),
            )

            try:
                prediction = make_prediction(task)

                results.append({
                    "taskId": task_id,
                    "taskName": task_name,
                    **prediction,
                })

            except Exception as error:
                print("Task prediction error:", error)

                results.append({
                    "taskId": task_id,
                    "taskName": task_name,
                    "prediction": None,
                    "result": "Prediction failed",
                    "confidence": None,
                    "error": str(error),
                })

        return jsonify({
            "success": True,
            "totalTasks": len(tasks),
            "results": results,
        }), 200

    except Exception as error:
        print("Batch prediction error:", error)
        return jsonify({
            "success": False,
            "message": str(error),
        }), 500


# Start production WSGI server
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))

    print("Starting Delay Prediction ML Service...")
    print(f"ML Service running on host=0.0.0.0 port={port}")

    serve(
        app,
        host="0.0.0.0",
        port=port,
    )
