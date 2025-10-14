---
layout: post
title: Manually editing chunks in git add --patch
extra:
    excerpt: Git allows to stage smaller chunks of code for creating more atomic commits.
tags:
  - Git
---

Using `git add --patch`, git can stage smaller chunks of code for creating more atomic commits.
The interactive mode provides chunks, and each can be staged using `y` or rejected using `n`.
But sometimes, a more granular chunk is needed, and that is where `s` and `e` come into play.
Where `s` tries to split it into smaller chunks, it might not always work wanted.
You can then use `e` to [manually edit a patch][1].

The desired change in the following example would be only to commit changes around variable `z`:

```diff
--- a/main.rs
+++ b/main.rs
@@ -1,5 +1,5 @@
 fn main() {
     let x = 5;
-    let y = 6;
-    let z = 7;
+    let y = 7;
+    let z = 8;
     println!("{} {} {}", x, y, z);
 }
```

We can use the `e` command to edit the chunk in a text editor manually.
To only commit the changes for variable `z`, we need to remove the line `+ let y = 7;` and change the `-` before `let y = 6` into a space ` `.
The patch should then look like this:

```diff
 fn main() {
     let x = 5;
     let y = 6;
-    let z = 7;
+    let z = 8;
     println!("{} {} {}", x, y, z);
 }
```

After saving and closing the editor, git will stage the modified patch, allowing you to create a commit with only the changes to variable `z`.

[1]: https://git-scm.com/docs/git-add#_editing_patches
