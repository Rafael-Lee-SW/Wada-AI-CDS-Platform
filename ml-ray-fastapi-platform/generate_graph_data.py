# generate_graph_data.py
import pandas as pd
import argparse
import os
from utils import generate_binary_condition

def generate_graph_data(
    file_path,
    node_features_path,
    edges_path,
    id_column,
    edge_source_column,
    edge_target_column,
    additional_features=None,
    feature_generations=None,
):
    df = pd.read_csv(file_path)

    if feature_generations:
        for fg in feature_generations:
            parts = fg.split(':')
            gen_type = parts[0]
            name_of_col = parts[1]
            if gen_type == "period" and len(parts) == 4:
                start_col = parts[2]
                end_col = parts[3]
                df[name_of_col] = (pd.to_datetime(df[end_col]) - pd.to_datetime(df[start_col])).dt.days
            elif gen_type == "binary_condition" and len(parts) > 4:
                conditions = []
                for i in range(2, len(parts), 3):
                    col = parts[i]
                    op = parts[i+1]
                    val = parts[i+2]
                    try:
                        val = float(val) if '.' in val else int(val)
                    except ValueError:
                        val = val.strip()
                    conditions.append({"column": col, "operator": op, "value": val})
                df = generate_binary_condition(df, name_of_col, conditions)

    if additional_features is None:
        additional_features = df.columns.drop([id_column, edge_source_column, edge_target_column]).tolist()

    node_features = df[[id_column]].copy()
    node_features = pd.concat([node_features, df[additional_features]], axis=1)
    node_features.to_csv(node_features_path, index=False)

    edges = df[[edge_source_column, edge_target_column]].dropna()
    edges = edges[edges[edge_target_column].isin(df[id_column])]
    edges = edges.rename(columns={edge_source_column: "source", edge_target_column: "target"})
    edges.to_csv(edges_path, index=False)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Graph Data")
    parser.add_argument("--file_path", type=str, required=True, help="Path to the main CSV file")
    parser.add_argument("--node_features_path", type=str, required=True, help="Path to save node_features.csv")
    parser.add_argument("--edges_path", type=str, required=True, help="Path to save edges.csv")
    parser.add_argument("--id_column", type=str, required=True, help="Column name for unique identifiers")
    parser.add_argument("--edge_source_column", type=str, required=True, help="Column name for edge source")
    parser.add_argument("--edge_target_column", type=str, required=True, help="Column name for edge target")
    parser.add_argument("--additional_features", type=str, nargs="*", help="Additional feature columns")
    parser.add_argument("--feature_generations", type=str, nargs="*", help="Feature generations")

    args = parser.parse_args()

    generate_graph_data(
        file_path=args.file_path,
        node_features_path=args.node_features_path,
        edges_path=args.edges_path,
        id_column=args.id_column,
        edge_source_column=args.edge_source_column,
        edge_target_column=args.edge_target_column,
        additional_features=args.additional_features,
        feature_generations=args.feature_generations,
    )
