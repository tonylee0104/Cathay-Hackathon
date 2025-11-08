# --------------------------------------------------------------
# ecoguard_ai_2.py   (SKY CARGO SOLUTIONS – PROTOCOL CREW + REAL WEATHER API)
# --------------------------------------------------------------
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import networkx as nx
import requests  # For API calls
from datetime import datetime, timedelta
import statsmodels.api as sm
import io

# Page config
st.set_page_config(page_title="Sky Cargo Solutions – Smart Cargo Handling", layout="wide")

# Title
st.title("Sky Cargo Solutions")
st.markdown("*AI-Powered Sustainable Cargo Optimization* | Cathay Hackathon 2025")
st.markdown("---")

# Tabs
tab1, tab2, tab3, tab4 = st.tabs(["Data & Controls", "Visualizations", "Analytics & Export", "Route Optimization"])

# --------------------------------------------------------------
# TAB 1 – Data source & simulation (unchanged)
# --------------------------------------------------------------
with tab1:
    st.header("Data Source & Optimization Settings")
    col_a, col_b = st.columns(2)

    with col_a:
        data_src = st.radio("Choose data source", ("Simulate", "Upload CSV"))

        waste_red = st.slider("Waste Reduction %", 20, 40, 30, key="waste_red")
        emiss_red = st.slider("Emissions Reduction %", 15, 30, 25, key="emiss_red")

        if data_src == "Simulate":
            days = st.slider("Days to simulate", 7, 365, 30, key="days")
            cargo_opts = ["General", "Hazardous", "Perishable"]
            cargo_sel = st.multiselect("Cargo types", cargo_opts, cargo_opts, key="cargo")
        else:
            days = None
            cargo_sel = None

    with col_b:
        csv_file = st.file_uploader(
            "Upload CSV (Date,Waste_Generated_kg,Emissions_CO2_tons,Compliance_Score,Cargo_Type,Cost_USD)",
            type="csv",
            key="csv_uploader"
        )

# --------------------------------------------------------------
# DATA LOADER (unchanged)
# --------------------------------------------------------------
@st.cache_data
def load_data(src, days=None, csv_file=None, waste_red=30, emiss_red=25, cargo_list=None):
    if src == "Upload CSV" and csv_file is not None:
        try:
            df = pd.read_csv(csv_file, encoding='utf-8', dtype=str)
            df.columns = df.columns.str.strip()
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            df['Waste_Generated_kg'] = pd.to_numeric(df['Waste_Generated_kg'], errors='coerce')
            df['Emissions_CO2_tons'] = pd.to_numeric(df['Emissions_CO2_tons'], errors='coerce')
            df['Compliance_Score'] = pd.to_numeric(df['Compliance_Score'], errors='coerce')
            df['Cost_USD'] = pd.to_numeric(df['Cost_USD'], errors='coerce')
            df = df.dropna(subset=['Date'])
        except Exception as e:
            st.error(f"CSV read error: {e}")
            st.stop()
    else:
        np.random.seed(42)
        dates = pd.date_range("2025-01-01", periods=days, freq="D")
        df = pd.DataFrame({
            "Date": dates,
            "Waste_Generated_kg": np.random.uniform(500, 1000, days),
            "Emissions_CO2_tons": np.random.uniform(10, 20, days),
            "Compliance_Score": np.random.uniform(80, 100, days),
            "Cargo_Type": np.random.choice(cargo_list or ["General"], days),
            "Cost_USD": np.random.uniform(1000, 5000, days)
        })

    df["Optimized_Waste"] = df["Waste_Generated_kg"] * (1 - waste_red/100)
    df["Optimized_Emissions"] = df["Emissions_CO2_tons"] * (1 - emiss_red/100)
    df["Optimized_Cost"] = df["Cost_USD"] * (1 - (waste_red + emiss_red)/200)
    df["Compliance_Status"] = np.where(df["Compliance_Score"] >= 90, "Compliant", "Alert")
    return df

df = load_data(src=data_src, days=days, csv_file=csv_file, waste_red=waste_red, emiss_red=emiss_red, cargo_list=cargo_sel)

st.subheader("Live Cargo Log")
st.dataframe(df, use_container_width=True)

# CV mock
st.subheader("Computer Vision Document Scan (Demo)")
img_file = st.file_uploader("Upload document image", type=["jpg","png"], key="img")
if img_file:
    st.image(img_file, width=300)
    cv_score = np.random.uniform(80, 100)
    st.metric("CV Compliance Score", f"{cv_score:.1f}%")
    if cv_score < 90:
        st.warning("Document flagged – manual review needed")

# --------------------------------------------------------------
# TAB 2 – Visualizations (unchanged)
# --------------------------------------------------------------
with tab2:
    st.header("Real-time Visualizations")
    c1, c2 = st.columns(2)

    with c1:
        fig_w = px.line(df, x="Date", y=["Waste_Generated_kg","Optimized_Waste"],
                        title="Waste Reduction", labels={"value":"kg"})
        st.plotly_chart(fig_w, use_container_width=True)

        fig_pie = px.pie(df, names="Cargo_Type", values="Waste_Generated_kg",
                         title="Waste by Cargo Type")
        st.plotly_chart(fig_pie, use_container_width=True)

    with c2:
        fig_e = px.bar(df, x="Date", y=["Emissions_CO2_tons","Optimized_Emissions"],
                       barmode="group", title="Emissions Reduction")
        st.plotly_chart(fig_e, use_container_width=True)

        fig_heat = px.density_heatmap(df, x="Date", y="Cargo_Type", z="Compliance_Score",
                                      title="Compliance Heatmap", color_continuous_scale="RdYlGn")
        st.plotly_chart(fig_heat, use_container_width=True)

# --------------------------------------------------------------
# TAB 3 – Analytics & Export (unchanged)
# --------------------------------------------------------------
with tab3:
    st.header("Predictive Analytics & Export")

    st.subheader("Future Emissions Forecast (Linear Regression)")
    pred_days = st.slider("Predict next N days", 7, 30, 14, key="pred")
    df["DayNum"] = (df["Date"] - df["Date"].min()).dt.days
    X = sm.add_constant(df["DayNum"])
    model = sm.OLS(df["Emissions_CO2_tons"], X).fit()

    future_nums = np.arange(df["DayNum"].max()+1, df["DayNum"].max()+1+pred_days)
    future_X = sm.add_constant(future_nums)
    future_em = model.predict(future_X)
    future_df = pd.DataFrame({
        "Date": pd.date_range(df["Date"].max()+timedelta(days=1), periods=pred_days),
        "Predicted_Emissions": future_em,
        "Optimized_Predicted": future_em * (1-emiss_red/100)
    })
    fig_pred = px.line(future_df, x="Date", y=["Predicted_Emissions","Optimized_Predicted"],
                       title="Emission Forecast")
    st.plotly_chart(fig_pred, use_container_width=True)

    st.subheader("Eco-Routing Engine")
    G = nx.Graph()
    nodes = ["Receiving","Inspection","Sorting","Storage","Palletization","Loading"]
    edges = [
        ("Receiving","Inspection",{"emiss":1.5,"cost":10}),
        ("Inspection","Sorting",{"emiss":2.0,"cost":15}),
        ("Sorting","Storage",{"emiss":3.5,"cost":20}),
        ("Sorting","Palletization",{"emiss":2.5,"cost":18}),
        ("Storage","Palletization",{"emiss":1.8,"cost":12}),
        ("Palletization","Loading",{"emiss":2.0,"cost":14})
    ]
    for u,v,d in edges: G.add_edge(u,v,**d)

    opt_by = st.selectbox("Optimize by", ("emiss","cost"), key="opt")
    path = nx.shortest_path(G, "Receiving","Loading", weight=opt_by)
    total = nx.shortest_path_length(G, "Receiving","Loading", weight=opt_by)
    red = emiss_red if opt_by=="emiss" else waste_red
    st.write(f"*Best route* → {' → '.join(path)}")
    st.write(f"{opt_by.capitalize()}: {total:.1f} → *After Sky Cargo Solutions: {total(1-red/100):.1f}")

    st.subheader("Export Report")
    csv_out = io.StringIO()
    df.to_csv(csv_out, index=False)
    st.download_button(
        label="Download CSV Report",
        data=csv_out.getvalue(),
        file_name="SkyCargo_Solutions_Report.csv",
        mime="text/csv"
    )

# --------------------------------------------------------------
# TAB 4 – Route Optimization + WORLD MAP + REAL WEATHER
# --------------------------------------------------------------
with tab4:
    st.header("Optimized Flight Route with World Map & Real Weather")
    st.markdown("Real-time route optimization with *great-circle paths, **altitude markers, and **live METAR weather* from NOAA Aviation API.")

    col1, col2 = st.columns(2)
    with col1:
        start_airport = st.selectbox("Origin", ["HKG", "PVG", "LAX", "JFK", "SIN", "DXB", "FRA", "NRT"])
        end_airport = st.selectbox("Destination", ["HKG", "PVG", "LAX", "JFK", "SIN", "DXB", "FRA", "NRT"])
        map_style = st.selectbox("Map Style", ["open-street-map", "carto-positron", "stamen-terrain"])
        use_real_weather = st.checkbox("Use Real Weather API (NOAA METAR)")

    with col2:
        weather_penalty = st.slider("Base Weather Severity (%)", 0, 50, 20)
        fuel_efficiency = st.slider("Fuel Efficiency (kg/km)", 0.5, 2.0, 1.0, step=0.1)
        cargo_load = st.slider("Cargo Load Factor", 1.0, 2.0, 1.2, step=0.1)
        cruise_altitude = st.slider("Cruise Altitude (FL)", 300, 410, 350, step=10)

    # Airport Coordinates + Names
    airports = {
        "HKG": (22.3193, 113.9365, "Hong Kong"),
        "PVG": (31.1434, 121.8052, "Shanghai"),
        "LAX": (33.9416, -118.4085, "Los Angeles"),
        "JFK": (40.6413, -73.7781, "New York"),
        "SIN": (1.3644, 103.9915, "Singapore"),
        "DXB": (25.2532, 55.3657, "Dubai"),
        "FRA": (50.0379, 8.5622, "Frankfurt"),
        "NRT": (35.7647, 140.3864, "Tokyo")
    }

    # Real Weather Function
    @st.cache_data(ttl=300)  # Cache for 5 min
    def get_real_weather(icao):
        try:
            url = f"https://aviationweather.gov/api/data/metar?ids={icao}&format=json"
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get('METAR', {}).get('data', []):
                    metar = data['METAR']['data'][0]
                    wind_speed = metar.get('windSpeedKt', 0) or 0
                    visibility = metar.get('visibilityStatuteMiles', 10) or 10
                    # Headwind penalty: High wind/visibility reduces efficiency
                    wind_penalty = max(0, (wind_speed - 10) / 50)  # 0-1 scale
                    vis_penalty = max(0, (10 - visibility) / 10)  # 0-1 scale
                    total_penalty = (wind_penalty + vis_penalty) * 50  # % penalty
                    return total_penalty, f"Wind: {wind_speed}kt, Vis: {visibility}SM"
                else:
                    return 20, "No data available"
            return 20, "API error"
        except:
            return 20, "Connection failed"

    if st.button("Calculate Optimum Route"):
        # Get real weather if enabled
        start_weather_penalty, start_info = get_real_weather(start_airport) if use_real_weather else (weather_penalty, "Simulated")
        end_weather_penalty, end_info = get_real_weather(end_airport) if use_real_weather else (weather_penalty, "Simulated")
        avg_weather_penalty = (start_weather_penalty + end_weather_penalty) / 2

        # Build Graph with weather-adjusted weights
        G = nx.Graph()
        for a1 in airports:
            for a2 in airports:
                if a1 != a2:
                    lat1, lon1, _ = airports[a1]
                    lat2, lon2, _ = airports[a2]
                    # Great-circle distance
                    dlat = np.radians(lat2 - lat1)
                    dlon = np.radians(lon2 - lon1)
                    a = np.sin(dlat/2)*2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)*2
                    dist = 6371 * 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))  # km
                    weight = dist * (1 + avg_weather_penalty/100) * fuel_efficiency * cargo_load
                    G.add_edge(a1, a2, weight=weight, distance=dist)

        try:
            path = nx.shortest_path(G, start_airport, end_airport, weight="weight")
            total_dist = sum(G[path[i]][path[i+1]]["distance"] for i in range(len(path)-1))
            total_fuel = total_dist * fuel_efficiency * cargo_load

            # Map Data
            lats, lons, names, alts = [], [], [], []
            for ap in path:
                lat, lon, name = airports[ap]
                lats.append(lat)
                lons.append(lon)
                names.append(f"{ap}<br>{name}")
                alts.append(f"FL{cruise_altitude}")

            # Great-circle arcs
            arc_lats, arc_lons = [], []
            for i in range(len(path)-1):
                lat1, lon1 = airports[path[i]][:2]
                lat2, lon2 = airports[path[i+1]][:2]
                steps = 50
                for t in np.linspace(0, 1, steps):
                    f = t
                    a = np.sin((1-f)*np.pi/2) / np.sin(np.pi/2)
                    b = np.sin(f*np.pi/2) / np.sin(np.pi/2)
                    x = a * np.cos(np.radians(lat1)) * np.cos(np.radians(lon1)) + b * np.cos(np.radians(lat2)) * np.cos(np.radians(lon2))
                    y = a * np.cos(np.radians(lat1)) * np.sin(np.radians(lon1)) + b * np.cos(np.radians(lat2)) * np.sin(np.radians(lon2))
                    z = a * np.sin(np.radians(lat1)) + b * np.sin(np.radians(lat2))
                    lat = np.degrees(np.arctan2(z, np.sqrt(x*2 + y*2)))
                    lon = np.degrees(np.arctan2(y, x))
                    arc_lats.append(lat)
                    arc_lons.append(lon)

            # Create Map
            fig = go.Figure()

            # Flight path
            fig.add_trace(go.Scattermapbox(
                lat=arc_lats, lon=arc_lons,
                mode='lines',
                line=dict(width=4, color='dodgerblue'),
                name='Flight Path'
            ))

            # Origin/Destination
            fig.add_trace(go.Scattermapbox(
                lat=[airports[start_airport][0], airports[end_airport][0]],
                lon=[airports[start_airport][1], airports[end_airport][1]],
                mode='markers+text',
                marker=dict(size=16, color=['red', 'green'], symbol='airport'),
                text=[start_airport, end_airport],
                textposition="top center",
                name="Origin/Destination"
            ))

            # Waypoints with altitude
            fig.add_trace(go.Scattermapbox(
                lat=lats, lon=lons,
                mode='markers+text',
                marker=dict(size=10, color='orange'),
                text=alts,
                textposition="bottom center",
                name="Waypoint Altitude"
            ))

            fig.update_layout(
                mapbox=dict(
                    style=map_style,
                    center=dict(lat=np.mean(lats), lon=np.mean(lons)),
                    zoom=2
                ),
                height=600,
                margin=dict(l=0, r=0, t=0, b=0),
                showlegend=True
            )

            st.plotly_chart(fig, use_container_width=True)

            # Metrics + Weather Info
            colm1, colm2, colm3, colm4 = st.columns(4)
            colm1.metric("Route", " → ".join(path))
            colm2.metric("Distance", f"{total_dist:,.0f} km")
            colm3.metric("Fuel", f"{total_fuel:,.0f} kg")
            colm4.metric("Altitude", f"FL{cruise_altitude}")

            st.info(f"*Start Weather ({start_airport})*: {start_info} | Penalty: +{start_weather_penalty:.0f}%")
            st.info(f"*End Weather ({end_airport})*: {end_info} | Penalty: +{end_weather_penalty:.0f}%")
            st.info(f"*Average Weather Penalty*: +{avg_weather_penalty:.0f}% (affects fuel/distance)")

        except nx.NetworkXNoPath:
            st.error("No route found. Try different airports.")

# Footer
st.caption("*Protocol Crew* – Cathay Hackathon 2025 | Sky Cargo Solutions")