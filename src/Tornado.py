import matplotlib.pyplot as plt
import numpy as np
import os
import pandas as pd
from matplotlib.lines import Line2D
import glob

def create_tornado_diagram(data, title, output_path=None):
    # Add data integrity check
    if data.shape[0] < 2: # Ensure there are at least two rows for val1 and val2
        print(f"Warning: Not enough data rows (expected at least 2, got {data.shape[0]}) for {title}. Skipping plot.")
        return

    # Get the legend column (first column) and numerical data columns
    legend_col = data.columns[0]
    numerical_cols = data.columns[1:]
    
    # Prepare data for sorting
    item_data = []
    for col in numerical_cols:
        val1 = pd.to_numeric(data.iloc[0][col], errors='coerce')
        val2 = pd.to_numeric(data.iloc[1][col], errors='coerce')

        # Handle NaN values as infinity
        if pd.isna(val1):
            val1 = float('inf')
        if pd.isna(val2):
            val2 = float('inf')

        # Use the actual values for bounds calculation
        minimum = min(val1, val2)
        maximum = max(val1, val2)

        # Calculate length for sorting and category
        if np.isinf(minimum) and np.isinf(maximum):
            sort_length = 0 # Both infinite, put them first (shortest "length")
            category = 2 # Both infinite
        elif np.isinf(minimum) or np.isinf(maximum):
            # One infinite, use the finite value's absolute magnitude for sorting
            if np.isinf(minimum):
                sort_length = abs(maximum) if not np.isinf(maximum) else 0 # Fallback if logic is flawed
            else: # maximum is inf
                sort_length = abs(minimum) if not np.isinf(minimum) else 0 # Fallback if logic is flawed
            category = 1 # One infinite
        else:
            sort_length = max(abs(minimum), abs(maximum))
            category = 0 # Both finite

        item_data.append({'col': col, 'minimum': minimum, 'maximum': maximum, 'sort_length': sort_length, 'category': category})

    # Sort the items: by category (finite < one_inf < both_inf), then by length
    item_data.sort(key=lambda x: (x['category'], x['sort_length']))

    # Update numerical_cols and y_positions based on sorted data
    sorted_numerical_cols = [item['col'] for item in item_data]
    sorted_y_positions = np.arange(len(sorted_numerical_cols))

    # Create figure and axis
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Define colors for positive and negative values
    positive_color = 'blue'  # Blue
    negative_color = 'red'  # Red
    bar_alpha = 0.8 # Increased opacity to reduce ghosting
    
    # Base y-positions for each numerical column (Y-axis item)
    y_positions = sorted_y_positions # Use sorted positions
    bar_height = 0.6  # Fixed height for each pair of bars
    
    # Iterate through each numerical column (Y-axis item)
    for i, col_name in enumerate(sorted_numerical_cols): # Iterate over sorted columns
        y_center = y_positions[i]

        # Get the original minimum and maximum bounds for the current sorted column
        current_item = next(item for item in item_data if item['col'] == col_name)
        minimum = current_item['minimum']
        maximum = current_item['maximum']

        # Plot minimum values on the left side (negative axis)
        if not np.isinf(minimum):
            # Convert minimum to negative for display on left side
            min_display_value = -abs(minimum)
            # Draw bar from negative position to 0
            ax.barh(y_center, abs(minimum), height=bar_height, color=negative_color, left=min_display_value, align='center', alpha=bar_alpha)

        # Plot maximum values on the right side (positive axis)
        if not np.isinf(maximum):
            # Draw bar from 0 to positive value
            ax.barh(y_center, maximum, height=bar_height, color=positive_color, left=0, align='center', alpha=bar_alpha)

    # Add grid
    ax.grid(True, linestyle='-', alpha=0.5)

    # Customize the plot
    ax.set_yticks(y_positions)
    ax.set_yticklabels(sorted_numerical_cols) # Use sorted column names for y-tick labels
    ax.set_xlabel('Weight Change')
    ax.set_title(title)
    
    # Add a vertical line at x=0
    ax.axvline(x=0, color='black', linestyle='-', alpha=0.3)
    
    # Adjust layout to prevent label cutoff
    plt.tight_layout()

    # Get current x-axis limits
    current_min_x, current_max_x = ax.get_xlim()
    
    # Set x-axis limits to show all data properly
    # Ensure we have enough range to show all values
    if current_min_x >= 0:
        # If all values are positive, set minimum to 0
        new_min_x = 0
    else:
        new_min_x = current_min_x
    
    if current_max_x <= 0:
        # If all values are negative, set maximum to 0
        new_max_x = 0
    else:
        new_max_x = current_max_x
    
    ax.set_xlim(left=new_min_x, right=new_max_x)

    # Set proper tick marks for both positive and negative axes with 0.1 step size
    min_x, max_x = ax.get_xlim()
    
    # Calculate tick positions based on actual data range
    if min_x < 0 and max_x > 0:
        # Both negative and positive values exist
        # Find the maximum absolute value from the data to determine tick range
        max_abs_value = max(abs(min_x), abs(max_x))
        
        # Round up to nearest 0.1 for tick range, no limit
        tick_range = np.ceil(max_abs_value * 10) / 10
        
        # Create ticks for negative side with 0.1 step, but only up to the actual minimum
        neg_max_abs = abs(min_x)
        neg_ticks = np.arange(0, min(neg_max_abs + 0.1, tick_range), 0.1)
        neg_ticks = -neg_ticks[::-1]  # Reverse and make negative
        
        # Create ticks for positive side with 0.1 step
        pos_ticks = np.arange(0, tick_range + 0.1, 0.1)
        
        # Combine ticks
        all_ticks = np.concatenate([neg_ticks, pos_ticks])
        ax.set_xticks(all_ticks)
        
        # Set labels for positive ticks only, leave negative ticks without labels
        tick_labels = []
        for tick in all_ticks:
            if tick >= 0:
                tick_labels.append(f'{tick:.1f}')
            else:
                tick_labels.append('')  # Empty label for negative ticks
        
        ax.set_xticklabels(tick_labels)
    else:
        # Only positive or only negative values - use simple linear spacing
        ax.set_xticks(np.linspace(min_x, max_x, 10))  # Use 10 evenly spaced ticks

    # Now, add triangles for infinite values at 95% x-position
    # Recalculate xlim after potential set_xlim to ensure correct positioning
    min_x, max_x = ax.get_xlim()
    
    # Calculate positions for infinity markers
    # Ensure positive infinity marker is always on the rightmost visible part of the plot
    pos_triangle_x_pos = max_x * 0.95 
    if pos_triangle_x_pos < 0: # If max_x is negative, push marker to a visible positive range
        pos_triangle_x_pos = max_x * 1.05 # or some other heuristic for visibility
    # Ensure negative infinity marker is always on the leftmost visible part of the plot
    neg_triangle_x_pos = min_x * 0.95 
    if neg_triangle_x_pos > 0: # If min_x is positive, push marker to a visible negative range
        neg_triangle_x_pos = min_x * 1.05 # or some other heuristic for visibility

    for i, col_name in enumerate(sorted_numerical_cols): # Iterate over sorted columns
        y_center = y_positions[i]
        
        current_item = next(item for item in item_data if item['col'] == col_name)
        val1 = current_item['minimum'] # Use already calculated minimum/maximum for infinity checks
        val2 = current_item['maximum']

        # Check each value for infinity and plot corresponding triangle
        for val in [val1, val2]:
            if np.isinf(val):
                if val > 0: # Positive infinity
                    ax.plot(pos_triangle_x_pos, y_center, marker='>', color=positive_color, markersize=10, clip_on=False, alpha=bar_alpha)
                elif val < 0: # Negative infinity
                    ax.plot(neg_triangle_x_pos, y_center, marker='<', color=negative_color, markersize=10, clip_on=False, alpha=bar_alpha)
    
    # Format x-axis ticks to show 3 decimal places
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.3f}'))
    
    # Create proxy artists for the legend
    legend_elements = [
        plt.Rectangle((0, 0), 1, 1, fc=positive_color, label='Maximum Values', alpha=bar_alpha),
        plt.Rectangle((0, 0), 1, 1, fc=negative_color, label='Minimum Values', alpha=bar_alpha),
        Line2D([0], [0], marker='>', color=positive_color, label='Positive Infinity',
               markersize=10, linestyle='None', alpha=bar_alpha),
        Line2D([0], [0], marker='<', color=negative_color, label='Negative Infinity',
               markersize=10, linestyle='None', alpha=bar_alpha)
    ]
    ax.legend(handles=legend_elements, bbox_to_anchor=(1.05, 1), loc='upper left')

    # Save the figure if output path is provided
    if output_path:
        plt.savefig(output_path, bbox_inches='tight', dpi=300)
    
    plt.close(fig) # Close the figure to free up memory

def process_excel_file_direct(file_path):
    """
    Process Excel file directly to get original data for tornado diagrams
    """
    try:
        # Read the Excel file
        df = pd.read_excel(file_path)
        
        # Get row 10 (index 9) to determine which columns to initially select
        row_10 = df.iloc[9]
        all_selected_columns = [col for col in df.columns if pd.notna(row_10[col]) and row_10[col] != 0]

        if not all_selected_columns:
            print(f"No valid columns found based on row 10 for {os.path.basename(file_path)}")
            return None

        # Get the actual names from row 2 (index 1)
        actual_names = df.iloc[1][all_selected_columns]
        
        # Create a mapping of numbered columns to actual names
        column_mapping = dict(zip(all_selected_columns, actual_names))
        
        # Extract data from row 2 (index 1) and rows 10-20 (index 9-19) for selected columns
        row_2_data = df.iloc[1:2][all_selected_columns]
        rows_10_to_20_data = df.iloc[9:20][all_selected_columns]
        selected_data = pd.concat([row_2_data, rows_10_to_20_data])
        
        # Rename the columns using the actual names
        selected_data = selected_data.rename(columns=column_mapping)
        
        # Remove rows where the first column of the *concatenated* data is empty
        if not selected_data.empty:
            first_column_name = selected_data.columns[0]
            selected_data = selected_data.dropna(subset=[first_column_name])
            # Reset index after dropping rows to ensure consistent iloc access
            selected_data = selected_data.reset_index(drop=True)
            if selected_data.empty:
                print(f"No valid rows after dropping empty in first column for {os.path.basename(file_path)}")
                return None
        else:
            print(f"No data selected based on row 10 criteria or initial rows for {os.path.basename(file_path)}")
            return None

        # Identify numerical columns for calculation (all columns except the first one, which is the legend)
        numerical_columns = selected_data.columns[1:]

        # Explicitly convert numerical columns to numeric, coercing errors to NaN
        for col in numerical_columns:
            selected_data[col] = pd.to_numeric(selected_data[col], errors='coerce')
        
        # Define sections using the *numerical data slices* after ensuring all relevant data is loaded
        sections_raw_data = {
            "Criteria Weight (Full Order)": selected_data.iloc[2:4],
            "Criteria Weight - Top:1": selected_data.iloc[4:6],
            "Criteria Weight Normalised (Full Order)": selected_data.iloc[6:8],
            "Criteria Weight Normalised - Top:1": selected_data.iloc[8:10]
        }
        
        return sections_raw_data
        
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return None

def main():
    # Create base output directory if it doesn't exist
    base_output_dir = os.path.join("image", "tornado_diagrams")
    if not os.path.exists(base_output_dir):
        os.makedirs(base_output_dir)
    
    # Get all Excel files in the data directory
    data_dir = os.path.join(os.getcwd(), 'data')
    excel_files = []
    for ext in ['*.xlsx', '*.xls']:
        excel_files.extend(glob.glob(os.path.join(data_dir, ext)))
    
    print(f"Found {len(excel_files)} Excel files")
    
    # Generate tornado diagrams for each file and section
    for file_path in excel_files:
        file_name_without_ext = os.path.splitext(os.path.basename(file_path))[0]
        
        # Create a subdirectory for each Excel file
        file_output_dir = os.path.join(base_output_dir, file_name_without_ext)
        if not os.path.exists(file_output_dir):
            os.makedirs(file_output_dir)
        
        # Process the Excel file directly
        sections_data = process_excel_file_direct(file_path)
        if sections_data:
            for section_name, section_data in sections_data.items():
                # Create a clean section name for the output file
                clean_section_name = section_name.replace(" ", "_").replace("(", "").replace(")", "").replace(":", "_")
                output_path = os.path.join(file_output_dir, f"{clean_section_name}.png")
                
                # Create and save the tornado diagram
                create_tornado_diagram(section_data, 
                                     f"{file_name_without_ext} - {section_name}",
                                     output_path)

if __name__ == "__main__":
    main()
