import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder

df = pd.read_csv("network_log.csv")
df = df.drop(columns=["Timestamp", "Note"])

encoders = {
    "src_ip": LabelEncoder(),
    "dst_ip": LabelEncoder(),
    "protocol": LabelEncoder()
}

df["Source IP"] = encoders["src_ip"].fit_transform(df["Source IP"])
df["Destination IP"] = encoders["dst_ip"].fit_transform(df["Destination IP"])
df["Protocol"] = encoders["protocol"].fit_transform(df["Protocol"])

iso_forest = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
iso_forest.fit(df)

joblib.dump(iso_forest, "isolation_forest_model.pkl")
joblib.dump(encoders, "label_encoders.pkl")

print("✅ Model training complete. You can now run the live detector.") 