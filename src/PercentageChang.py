import pandas as pd
import os
import glob
import numpy as np

class ExcelProcessor:
    def __init__(self, directory_path=None):
        """
        Initialize the ExcelProcessor with an optional directory path.
        If no directory is provided, it will use the 'data' directory.
        """
        self.directory_path = directory_path or os.path.join(os.getcwd(), 'data')
        self.results = {}

    def process_excel_file(self, file_path):
        """
        Process a single Excel file and return the processed data.
        
        Returns:
            dict: A dictionary containing:
                - project_names: Series of project names
                - reference_data: Series of reference data
                - processed_data: Dict of processed sections with percentage changes
                - original_data: DataFrame of original selected data
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

            # Get project names from the first row of the original data
            project_names = actual_names
            
            # Get reference data (second row of selected_data)
            reference_data = selected_data.iloc[1]
            
            # Define sections using the *numerical data slices* after ensuring all relevant data is loaded
            sections_raw_data = {
                "Criteria Weight (Full Order)": selected_data.iloc[2:4],
                "Criteria Weight - Top:1": selected_data.iloc[4:6],
                "Criteria Weight Normalised (Full Order)": selected_data.iloc[6:8],
                "Criteria Weight Normalised - Top:1": selected_data.iloc[8:10]
            }
            
            # Calculate ratios for each section, only for numerical columns
            processed_data = {}
            for section_name, section_df in sections_raw_data.items():
                # Create a DataFrame for ratios with numerical columns only
                ratio_df = pd.DataFrame(index=section_df.index, columns=numerical_columns)
                for col in numerical_columns:
                    for idx in section_df.index:
                        current_value = section_df.loc[idx, col]
                        ref_value = reference_data[col]

                        if pd.isna(current_value) or pd.isna(ref_value):
                            ratio_df.loc[idx, col] = float('inf')
                        elif ref_value == 0:
                            ratio_df.loc[idx, col] = float('inf')
                        else:
                            # Convert ratio to percentage
                            ratio_df.loc[idx, col] = ((current_value - ref_value) / ref_value) * 100
                
                # Add legend column back to the ratio DataFrame
                ratio_df.insert(0, selected_data.columns[0], section_df[selected_data.columns[0]])
                processed_data[section_name] = ratio_df
            
            # Store results
            results = {
                'project_names': project_names,
                'reference_data': reference_data,
                'processed_data': processed_data,
                'original_data': selected_data,
                'file_name': os.path.basename(file_path)
            }
            
            return results
        
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")
            return None

    def process_directory(self, print_results=False):
        """
        Process all Excel files in the specified directory.
        
        Args:
            print_results (bool): Whether to print the results to console (default: False)
            
        Returns:
            dict: Dictionary containing results for all processed files
        """
        # Get all Excel files in the directory
        excel_files = glob.glob(os.path.join(self.directory_path, "*.xlsx")) + \
                     glob.glob(os.path.join(self.directory_path, "*.xls"))
        
        if not excel_files:
            print("No Excel files found in the directory!")
            return {}
        
        print(f"Found {len(excel_files)} Excel files")
        
        # Process each Excel file
        all_results = {}
        for file in excel_files:
            results = self.process_excel_file(file)
            if results:
                all_results[file] = results
                if print_results:
                    self._print_results(results)
        
        self.results = all_results
        return all_results

    def _print_results(self, results):
        """Helper method to print results in a formatted way"""
        print(f"\nProcessing file: {results['file_name']}")
        print("\nProject Names:")
        print(results['project_names'])
        print("\nProcessed Data (Percentages) - Including Legend Column:")
        for section_name, section_data in results['processed_data'].items():
            print(f"\n{section_name}:")
            print(section_data)

    def get_results(self):
        """Get the processed results"""
        return self.results

    def get_section_data(self, file_path, section_name):
        """
        Get data for a specific section from a specific file
        
        Args:
            file_path (str): Path to the Excel file
            section_name (str): Name of the section to retrieve
            
        Returns:
            DataFrame: The processed data for the specified section
        """
        if file_path in self.results:
            if section_name in self.results[file_path]['processed_data']:
                return self.results[file_path]['processed_data'][section_name]
        return None

def main():
    # Example usage
    processor = ExcelProcessor()
    results = processor.process_directory()
    return results

if __name__ == "__main__":
    results = main()
