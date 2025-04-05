"""
Table renaming script for SQLite database.
This script renames the 'user_client_association' table to 'user_client' in the database.
"""
import os
import sys
import sqlite3
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Table-Renamer")

def rename_table(db_path, old_name, new_name):
    """Rename a table in SQLite database"""
    
    if not os.path.exists(db_path):
        logger.error(f"Database file {db_path} does not exist")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the old table exists
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{old_name}'")
        if not cursor.fetchone():
            logger.warning(f"Table '{old_name}' does not exist in the database")
            
            # Check if the new table already exists
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{new_name}'")
            if cursor.fetchone():
                logger.info(f"Table '{new_name}' already exists, no need to rename")
                return True
            
            return False
        
        # Check if the destination table already exists
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{new_name}'")
        if cursor.fetchone():
            logger.warning(f"Table '{new_name}' already exists, dropping it first")
            cursor.execute(f"DROP TABLE IF EXISTS {new_name}")
        
        # Rename the table
        logger.info(f"Renaming table from '{old_name}' to '{new_name}'")
        cursor.execute(f"ALTER TABLE {old_name} RENAME TO {new_name}")
        
        # Commit the changes
        conn.commit()
        
        # Verify the rename
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{new_name}'")
        if cursor.fetchone():
            logger.info(f"Successfully renamed table to '{new_name}'")
            result = True
        else:
            logger.error(f"Failed to rename table to '{new_name}'")
            result = False
        
        # Close the connection
        conn.close()
        
        return result
    
    except sqlite3.Error as e:
        logger.error(f"SQLite error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

def main():
    """Main function"""
    # Path to the database file
    db_path = "marketing_tool.db"
    
    # Tables to rename
    tables_to_rename = [
        ("user_client_association", "user_client")
    ]
    
    # Rename each table
    success = True
    for old_name, new_name in tables_to_rename:
        if not rename_table(db_path, old_name, new_name):
            success = False
    
    return success

if __name__ == "__main__":
    if main():
        sys.exit(0)
    else:
        sys.exit(1) 