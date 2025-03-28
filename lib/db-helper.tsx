/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple database helper that uses localStorage in the browser
// and in-memory storage on the server

import { logger } from "./logger";

// In-memory storage for server-side
const serverStorage: Record<string, any[]> = {
  automations: [],
};

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export const db = {
  // Get all items from a collection
  getAll: async (collection: string): Promise<any[]> => {
    try {
      if (typeof window === "undefined") {
        // Server-side
        return serverStorage[collection] || [];
      } else {
        // Client-side
        const data = localStorage.getItem(collection);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      logger.error(`Error getting all items from ${collection}:`, error);
      return [];
    }
  },

  // Get an item by ID
  getById: async (collection: string, id: string): Promise<any | undefined> => {
    try {
      const items = await db.getAll(collection);
      return items.find((item) => item.id === id);
    } catch (error) {
      logger.error(`Error getting item by ID from ${collection}:`, error);
      return undefined;
    }
  },

  // Add an item to a collection
  add: async (collection: string, item: any): Promise<any> => {
    try {
      const items = await db.getAll(collection);
      const newItem = { ...item, id: item.id || generateId() };
      const newItems = [...items, newItem];

      if (typeof window === "undefined") {
        // Server-side
        serverStorage[collection] = newItems;
      } else {
        // Client-side
        localStorage.setItem(collection, JSON.stringify(newItems));
      }

      return newItem;
    } catch (error) {
      logger.error(`Error adding item to ${collection}:`, error);
      throw error;
    }
  },

  // Update an item in a collection
  update: async (
    collection: string,
    id: string,
    updates: any
  ): Promise<boolean> => {
    try {
      const items = await db.getAll(collection);
      const index = items.findIndex((item) => item.id === id);

      if (index === -1) {
        return false;
      }

      const updatedItems = [
        ...items.slice(0, index),
        { ...items[index], ...updates },
        ...items.slice(index + 1),
      ];

      if (typeof window === "undefined") {
        // Server-side
        serverStorage[collection] = updatedItems;
      } else {
        // Client-side
        localStorage.setItem(collection, JSON.stringify(updatedItems));
      }

      return true;
    } catch (error) {
      logger.error(`Error updating item in ${collection}:`, error);
      throw error;
    }
  },

  // Remove an item from a collection
  remove: async (collection: string, id: string): Promise<boolean> => {
    try {
      const items = await db.getAll(collection);
      const filteredItems = items.filter((item) => item.id !== id);

      if (filteredItems.length === items.length) {
        return false;
      }

      if (typeof window === "undefined") {
        // Server-side
        serverStorage[collection] = filteredItems;
      } else {
        // Client-side
        localStorage.setItem(collection, JSON.stringify(filteredItems));
      }

      return true;
    } catch (error) {
      logger.error(`Error removing item from ${collection}:`, error);
      throw error;
    }
  },
};
