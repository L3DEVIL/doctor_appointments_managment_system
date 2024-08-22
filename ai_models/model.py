from flask import Flask, request, jsonify, render_template
import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)

# Load the models and scaler
loaded_clf = joblib.load('best_specialty_classifier.pkl')
loaded_reg_severity = joblib.load('best_severity_regressor.pkl')
loaded_reg_experience = joblib.load('best_experience_regressor.pkl')
loaded_reg_success = joblib.load('best_success_regressor.pkl')
loaded_reg_feedback = joblib.load('best_feedback_regressor.pkl')
loaded_scaler = joblib.load('scaler.pkl')

# Define all feature columns used during training
feature_columns = [
    'age', 'gender_Female', 'gender_Male',
    'current_symptoms_Allergic Reactions', 'current_symptoms_Anxiety', 'current_symptoms_Arthritis',
    'current_symptoms_Blood Disorders', 'current_symptoms_Breathing Difficulty', 'current_symptoms_Chest Pain',
    'current_symptoms_Cold', 'current_symptoms_Cough', 'current_symptoms_Diarrhea', 'current_symptoms_Fatigue',
    'current_symptoms_Fever', 'current_symptoms_Headache', 'current_symptoms_High Blood Sugar',
    'current_symptoms_Infections', 'current_symptoms_Joint Pain', 'current_symptoms_Kidney Issues',
    'current_symptoms_Lump or Swelling', 'current_symptoms_Skin Rash', 'current_symptoms_Sore Throat',
    'current_symptoms_Stomach Pain', 'current_symptoms_Unknown Disease', 'current_symptoms_Urinary Issues',
    'current_symptoms_Vision Problems', 'medical_history_Arthritis', 'medical_history_Asthma',
    'medical_history_Cancer', 'medical_history_Chronic Kidney Disease', 'medical_history_Diabetes',
    'medical_history_Heart Disease', 'medical_history_Hypertension', 'medical_history_No History',
    'medical_history_Obesity'
]

@app.route('/predict', methods=['POST'])
def predict():
    # Get the input data from the request
    input_data = request.json

    # Create DataFrame with the exact feature columns
    input_df = pd.DataFrame([input_data])

    # Ensure all features are present and set missing columns to 0
    for col in feature_columns:
        if col not in input_df.columns:
            input_df[col] = 0

    # Reorder columns to match the training feature order
    input_df = input_df[feature_columns]

    # Feature scaling
    input_scaled = loaded_scaler.transform(input_df)

    # Predict using the loaded models
    pred_specialty = loaded_clf.predict(input_scaled)
    pred_severity = loaded_reg_severity.predict(input_scaled)
    pred_experience = loaded_reg_experience.predict(input_scaled)
    pred_success_rate = loaded_reg_success.predict(input_scaled)
    pred_feedback = loaded_reg_feedback.predict(input_scaled)

    # Prepare the results
    results = {
        'pred_specialty': pred_specialty.tolist(),
        'pred_severity': pred_severity.tolist(),
        'pred_experience': pred_experience.tolist(),
        'pred_success_rate': pred_success_rate.tolist(),
        'pred_feedback': pred_feedback.tolist()
    }

    return jsonify(results)

@app.route('/')
def index():
    return render_template('readme.html')

if __name__ == '__main__':
    # Set to False for production deployment
    app.run(debug=False, host='0.0.0.0')
