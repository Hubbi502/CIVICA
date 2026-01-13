/**
 * Create Post Placeholder (redirects to create screen)
 */

import { Redirect } from 'expo-router';

export default function CreateTab() {
    // This tab redirects to the create post modal
    return <Redirect href="/post/create" />;
}
