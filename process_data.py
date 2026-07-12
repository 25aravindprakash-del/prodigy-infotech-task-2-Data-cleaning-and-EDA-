import pandas as pd
import numpy as np
import json

def main():
    print("Loading data...")
    # Load dataset
    df = pd.read_csv("train.csv")
    
    # 1. Data Cleaning
    print("Performing data cleaning...")
    
    # Check missing values
    missing_before = df.isnull().sum().to_dict()
    
    # Impute Age with median age
    median_age = df['Age'].median()
    df['Age'] = df['Age'].fillna(median_age)
    
    # Impute Embarked with the mode (most common value)
    mode_embarked = df['Embarked'].mode()[0]
    df['Embarked'] = df['Embarked'].fillna(mode_embarked)
    
    # Cabin: fill missing with 'Unknown' and extract cabin letter (deck)
    df['Cabin'] = df['Cabin'].fillna('Unknown')
    df['Deck'] = df['Cabin'].apply(lambda x: x[0] if x != 'Unknown' else 'Unknown')
    
    # Drop PassengerId, Name, Ticket from clean table but keep for display reference
    # Family Size
    df['FamilySize'] = df['SibSp'] + df['Parch'] + 1
    df['IsAlone'] = (df['FamilySize'] == 1).astype(int)
    
    # Categorize Age
    def categorize_age(age):
        if age < 12:
            return 'Child (0-11)'
        elif age < 20:
            return 'Teenager (12-19)'
        elif age < 35:
            return 'Young Adult (20-34)'
        elif age < 55:
            return 'Adult (35-54)'
        else:
            return 'Senior (55+)'
    
    df['AgeGroup'] = df['Age'].apply(categorize_age)
    
    # Categorize Fare
    df['FareGroup'] = pd.qcut(df['Fare'], q=4, labels=['Low', 'Medium-Low', 'Medium-High', 'High']).astype(str)
    
    # Check missing values after cleaning
    missing_after = df.isnull().sum().to_dict()
    
    # 2. Exploratory Data Analysis (EDA) stats
    print("Generating EDA stats...")
    
    # Overall survival stats
    total_passengers = int(len(df))
    total_survived = int(df['Survived'].sum())
    total_died = total_passengers - total_survived
    overall_survival_rate = float(df['Survived'].mean() * 100)
    
    # Survival by Sex
    survival_by_sex = df.groupby('Sex')['Survived'].agg(['count', 'sum', 'mean']).reset_index()
    survival_by_sex.columns = ['Sex', 'Total', 'Survived', 'SurvivalRate']
    survival_by_sex['SurvivalRate'] = survival_by_sex['SurvivalRate'] * 100
    survival_by_sex_list = survival_by_sex.to_dict(orient='records')
    
    # Survival by Pclass
    survival_by_class = df.groupby('Pclass')['Survived'].agg(['count', 'sum', 'mean']).reset_index()
    survival_by_class.columns = ['Pclass', 'Total', 'Survived', 'SurvivalRate']
    survival_by_class['SurvivalRate'] = survival_by_class['SurvivalRate'] * 100
    survival_by_class_list = survival_by_class.to_dict(orient='records')
    
    # Survival by Age Group
    survival_by_age = df.groupby('AgeGroup')['Survived'].agg(['count', 'sum', 'mean']).reset_index()
    survival_by_age.columns = ['AgeGroup', 'Total', 'Survived', 'SurvivalRate']
    survival_by_age['SurvivalRate'] = survival_by_age['SurvivalRate'] * 100
    # Custom sort order for age groups
    age_order = {'Child (0-11)': 0, 'Teenager (12-19)': 1, 'Young Adult (20-34)': 2, 'Adult (35-54)': 3, 'Senior (55+)': 4}
    survival_by_age['Order'] = survival_by_age['AgeGroup'].map(age_order)
    survival_by_age = survival_by_age.sort_values('Order').drop(columns=['Order'])
    survival_by_age_list = survival_by_age.to_dict(orient='records')
    
    # Survival by Embarked
    survival_by_embarked = df.groupby('Embarked')['Survived'].agg(['count', 'sum', 'mean']).reset_index()
    survival_by_embarked.columns = ['Embarked', 'Total', 'Survived', 'SurvivalRate']
    survival_by_embarked['SurvivalRate'] = survival_by_embarked['SurvivalRate'] * 100
    survival_by_embarked_list = survival_by_embarked.to_dict(orient='records')
    
    # Correlation Matrix
    corr_cols = ['Survived', 'Pclass', 'Age', 'SibSp', 'Parch', 'Fare', 'FamilySize']
    corr_matrix = df[corr_cols].corr().round(3).values.tolist()
    
    # Age vs Fare Scatter plot data (sample 200)
    scatter_data = df.sample(n=min(200, len(df)), random_state=42)[['Age', 'Fare', 'Survived', 'Sex', 'Pclass']].to_dict(orient='records')
    
    # Cleaned passengers records (first 100)
    passengers_sample = df.head(100).to_dict(orient='records')
    
    # Combine all stats into a single dict
    stats = {
        "missing_before": missing_before,
        "missing_after": missing_after,
        "overall": {
            "total": total_passengers,
            "survived": total_survived,
            "died": total_died,
            "rate": overall_survival_rate
        },
        "by_sex": survival_by_sex_list,
        "by_class": survival_by_class_list,
        "by_age": survival_by_age_list,
        "by_embarked": survival_by_embarked_list,
        "corr_matrix": {
            "columns": corr_cols,
            "values": corr_matrix
        },
        "scatter": scatter_data,
        "passengers": passengers_sample
    }
    
    # Save as JSON
    with open("cleaned_data.json", "w") as f:
        json.dump(stats, f, indent=2)
        
    # Save a CSV copy of the cleaned dataset
    df.to_csv("titanic_cleaned.csv", index=False)
    
    print("Done! Statistics exported to cleaned_data.json and cleaned dataset to titanic_cleaned.csv")

if __name__ == "__main__":
    main()
