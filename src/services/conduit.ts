import { Err, Ok, Result } from '@hqoss/monads';
import axios from 'axios';
import { array, guard, object, string } from 'decoders';
import settings from '../config/settings';
import {
  Article,
  articleDecoder,
} from '../types/article';
import { Comment, commentDecoder } from '../types/comment';
import { Profile, profileDecoder } from '../types/profile';

axios.defaults.baseURL = settings.baseApiUrl;

export async function favoriteArticle(slug: string): Promise<Article> {
  return guard(object({ article: articleDecoder }))((await axios.post(`articles/${slug}/favorite`)).data).article;
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  return guard(object({ article: articleDecoder }))((await axios.delete(`articles/${slug}/favorite`)).data).article;
}

export async function followUser(username: string): Promise<Profile> {
  const { data } = await axios.post(`profiles/${username}/follow`);
  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const { data } = await axios.delete(`profiles/${username}/follow`);
  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function getArticleComments(slug: string): Promise<Comment[]> {
  const { data } = await axios.get(`articles/${slug}/comments`);
  return guard(object({ comments: array(commentDecoder) }))(data).comments;
}

export async function deleteComment(slug: string, commentId: number): Promise<void> {
  await axios.delete(`articles/${slug}/comments/${commentId}`);
}

export async function createComment(slug: string, body: string): Promise<Comment> {
  const { data } = await axios.post(`articles/${slug}/comments`, { comment: { body } });
  return guard(object({ comment: commentDecoder }))(data).comment;
}

export async function deleteArticle(slug: string): Promise<void> {
  await axios.delete(`articles/${slug}`);
}
