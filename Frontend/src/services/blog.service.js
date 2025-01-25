import axios from '../Config/Axios';
import { logger } from '../utils/logger';

export const blogService = {
  async getBlogs(params = {}) {
    try {
      // Clean up undefined/null values from params
      const cleanParams = Object.entries(params)
        .reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
          }
          return acc;
        }, {});

      logger.info('Fetching blogs with params:', cleanParams);
      const { data } = await axios.get('/api/blogs', { params: cleanParams });
      logger.success('Successfully fetched blogs');
      return data;
    } catch (error) {
      logger.error('Failed to fetch blogs:', error);
      throw error;
    }
  },

  async getBlogBySlug(slug) {
    try {
      logger.info('Fetching blog with slug:', slug);
      const { data } = await axios.get(`/api/blogs/${slug}`);
      logger.success('Successfully fetched blog');
      return data;
    } catch (error) {
      logger.error('Failed to fetch blog:', error);
      throw error;
    }
  },

  async createBlog(blogData) {
    try {
      logger.info('Creating new blog');
      const { data } = await axios.post('/api/blogs', blogData);
      logger.success('Successfully created blog');
      return data;
    } catch (error) {
      logger.error('Failed to create blog:', error);
      throw error;
    }
  },

  async updateBlog(id, blogData) {
    try {
      logger.info('Updating blog:', id);
      const { data } = await axios.put(`/api/blogs/${id}`, blogData);
      logger.success('Successfully updated blog');
      return data;
    } catch (error) {
      logger.error('Failed to update blog:', error);
      throw error;
    }
  },

  async toggleLike(blogId) {
    try {
      logger.info('Toggling blog like:', blogId);
      const { data } = await axios.post(`/api/blogs/${blogId}/like`);
      logger.success('Successfully toggled blog like');
      return data;
    } catch (error) {
      logger.error('Failed to toggle blog like:', error);
      throw error;
    }
  },

  async uploadImage(file) {
    try {
      logger.info('Uploading image');
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axios.post('/api/upload', formData);
      logger.success('Successfully uploaded image');
      return data.url;
    } catch (error) {
      logger.error('Failed to upload image:', error);
      throw error;
    }
  },

  async getBlogById(id) {
    try {
      logger.info('Fetching blog:', id);
      const { data } = await axios.get(`/api/blogs/id/${id}`);
      logger.success('Successfully fetched blog');
      return data;
    } catch (error) {
      logger.error('Failed to fetch blog:', error);
      throw error;
    }
  },

  async deleteBlog(id) {
    try {
      logger.info('Deleting blog:', id);
      const { data } = await axios.delete(`/api/blogs/${id}`);
      logger.success('Successfully deleted blog');
      return data;
    } catch (error) {
      logger.error('Failed to delete blog:', error);
      throw error;
    }
  },

  async getBlogStats() {
    try {
      const response = await axios.get('/api/blogs/stats');
      return response.data.stats;
    } catch (error) {
      logger.error('Error fetching blog stats:', error);
      throw error;
    }
  }
};
