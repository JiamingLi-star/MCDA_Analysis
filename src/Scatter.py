import matplotlib.pyplot as plt
import numpy as np
from PercentageChang import ExcelProcessor
import os
import pandas as pd
from matplotlib.lines import Line2D

def is_dominated(point, points):
    """Check if a point is dominated by any other point.
    Both X and Y values are better when smaller."""
    for other_point in points:
        if other_point[0] <= point[0] and other_point[1] <= point[1]:
            if other_point[0] < point[0] or other_point[1] < point[1]:
                return True
    return False

def create_scatter_plot(data, title, output_path=None):
    # Add data integrity check
    if data.shape[0] < 2:
        print(f"Warning: Not enough data rows (expected at least 2, got {data.shape[0]}) for {title}. Skipping plot.")
        return

    # Get the legend column and numerical data columns
    legend_col = data.columns[0]
    numerical_cols = data.columns[1:]
    
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Generate unique colors for each point
    num_points = len(numerical_cols)
    colors = plt.cm.rainbow(np.linspace(0, 1, num_points))
    
    # Lists to store valid data points and their labels
    points = []
    labels = []
    valid_cols = []
    infinity_points = []  # Store infinity points for triangle markers
    
    # First pass: collect valid points and infinity points
    for i, col in enumerate(numerical_cols):
        val1 = pd.to_numeric(data.iloc[0][col], errors='coerce')
        val2 = pd.to_numeric(data.iloc[1][col], errors='coerce')
        
        # Handle NaN values as infinity
        if pd.isna(val1):
            val1 = float('inf')
        if pd.isna(val2):
            val2 = float('inf')
        
        # Check for infinity values
        if np.isinf(val1) or np.isinf(val2):
            infinity_points.append({
                'col': col,
                'val1': val1,
                'val2': val2,
                'color': colors[i],
                'index': i
            })
            continue
            
        # If one value is infinity, use the finite value for both min and max
        if np.isinf(val1) and not np.isinf(val2):
            min_val = max_val = val2
        elif np.isinf(val2) and not np.isinf(val1):
            min_val = max_val = val1
        else:
            # Both values are finite
            min_val = min(val1, val2)
            max_val = max(val1, val2)
        
        # Only add points if we have valid finite values
        if not np.isinf(min_val) and not np.isinf(max_val) and min_val != 0 and max_val != 0:
            points.append((abs(min_val), abs(max_val)))  # Use absolute values for both
            labels.append(col)
            valid_cols.append(col)
    
    # Check if we have any valid points or infinity points
    if not points and not infinity_points:
        print(f"Warning: No valid data points found for {title}. Skipping plot.")
        plt.close(fig)
        return
    
    # Find non-dominated points
    non_dominated = []
    if points:
        for i, point in enumerate(points):
            if not is_dominated(point, points):
                non_dominated.append((point, labels[i]))
    
    # Plot dominated points
    for i, (point, label) in enumerate(zip(points, labels)):
        if point not in [p[0] for p in non_dominated]:
            ax.scatter(point[0], point[1], color=colors[valid_cols.index(label)], s=100, 
                      label=f"{label} (Dominated)")
    
    # Plot non-dominated points
    for point, label in non_dominated:
        ax.scatter(point[0], point[1], color=colors[valid_cols.index(label)], s=150,
                  edgecolor='black', linewidth=1.5, label=f"{label} (Non-dominated)")
    
    # Plot infinity points as triangles at the edges
    if infinity_points:
        # Calculate plot limits for positioning triangles
        if points:
            x_max = max(p[0] for p in points) * 1.1
            y_max = max(p[1] for p in points) * 1.1
        else:
            x_max = y_max = 100  # Default limits if no finite points
        
        for inf_point in infinity_points:
            col = inf_point['col']
            val1 = inf_point['val1']
            val2 = inf_point['val2']
            color = inf_point['color']
            
            # Position triangles at the edges
            if np.isinf(val1) and np.isinf(val2):
                # Both infinite - place at corner
                ax.plot(x_max * 0.95, y_max * 0.95, marker='^', color=color, markersize=12, 
                       label=f"{col} (∞,∞)", clip_on=False)
            elif np.isinf(val1):
                # Only val1 infinite - place at top
                ax.plot(x_max * 0.5, y_max * 0.95, marker='^', color=color, markersize=12, 
                       label=f"{col} (∞,{val2:.2f})", clip_on=False)
            elif np.isinf(val2):
                # Only val2 infinite - place at right
                ax.plot(x_max * 0.95, y_max * 0.5, marker='>', color=color, markersize=12, 
                       label=f"{col} ({val1:.2f},∞)", clip_on=False)
    
    # Add grid
    ax.grid(True, linestyle='-', alpha=0.5)
    
    # Customize the plot
    ax.set_xlabel('Criteria Percentage Decrease(%)')
    ax.set_ylabel('Criteria Percentage Increase(%)')
    ax.set_title(f"{title}")
    
    # Set axis limits with safety checks
    try:
        if points:
            x_max = max(p[0] for p in points) * 1.1
            y_max = max(p[1] for p in points) * 1.1
        else:
            x_max = y_max = 100
        ax.set_xlim(0, x_max)
        ax.set_ylim(0, y_max)
    except ValueError:
        print(f"Warning: Could not set axis limits for {title}. Using default limits.")
        ax.set_xlim(0, 100)
        ax.set_ylim(0, 100)
    
    # Add reference lines
    ax.axvline(x=0, color='black', linestyle='-', alpha=0.3)
    ax.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    
    # Add legend
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    
    # Adjust layout
    plt.tight_layout()
    
    # Save the figure if output path is provided
    if output_path:
        plt.savefig(output_path, bbox_inches='tight', dpi=300)
    
    plt.close(fig)

def main():
    # Initialize the Excel processor
    processor = ExcelProcessor()
    results = processor.process_directory(print_results=False)
    
    # Create base output directory if it doesn't exist
    base_output_dir = os.path.join("image", "scatter_plots")
    if not os.path.exists(base_output_dir):
        os.makedirs(base_output_dir)
    
    # Generate scatter plots for each file and section
    for file_path, file_results in results.items():
        file_name_without_ext = os.path.splitext(os.path.basename(file_path))[0]
        
        # Create a subdirectory for each Excel file
        file_output_dir = os.path.join(base_output_dir, file_name_without_ext)
        if not os.path.exists(file_output_dir):
            os.makedirs(file_output_dir)
        
        for section_name, section_data in file_results['processed_data'].items():
            # Create a clean section name for the output file
            clean_section_name = section_name.replace(" ", "_").replace("(", "").replace(")", "").replace(":", "_")
            output_path = os.path.join(file_output_dir, f"{clean_section_name}.png")
            
            # Create and save the scatter plot
            create_scatter_plot(section_data, 
                              f"{file_name_without_ext} - {section_name}",
                              output_path)

if __name__ == "__main__":
    main()
