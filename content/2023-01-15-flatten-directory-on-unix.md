---
layout: post
title: Flatten a directory on Unix systems
extra:
    excerpt: When cleaning up a bit on my computer, I wanted to flatten a directory structure. Not wanting to move everything by hand, I searched for a way to automate it.
tags: 
  - Shell
  - macOS
---

When cleaning up a bit on my computer, I wanted to flatten a directory structure.
Not wanting to move everything by hand, I searched for a way to automate it.
On macOS and Linux, there is a command [`find`][1] that lets you find files deeply nested.

## Moving files

The command above finds all nested files with at least one directory down and then passes the arguments to the move [`mv`][2] command.
Here the `/path/to/directory` directory is the directory we want to flatten.

```shell
find /path/to/directory -mindepth 2 -type f -exec mv '{}' /path/to/directory \;
```

With `-type f`, we only find files in the given directory where we want it to look at least from a depth of two.
The move will overwrite files with the same name.
To control which one to overwrite or not, add `-i` to the `mv` command to interactively approve overwrites or `-f` to force overwrites.

### Example

```
/path/to/directory
|-- subdir1/
|   |-- subsubdir1/
|   |   |-- file1.txt
|   |   |-- file2.txt
|   |-- subsubdir2/
|       |-- file3.txt
|-- subdir2/
    |-- file4.txt
    |-- subsubdir3/
        |-- file5.txt
        |-- file6.txt
```

After running the command, the directory will look like this:

```
/path/to/directory
|-- subdir1/
|   |-- subsubdir1/
|   |-- subsubdir2/
|-- subdir2/
|   |-- subsubdir3/
|-- file1.txt
|-- file2.txt
|-- file3.txt
|-- file4.txt
|-- file5.txt
|-- file6.txt
```

## Cleaning up

After moving, I still had a lot of empty directories.
Deleting them by hand would be little work, but what if I could also automate it?
We can use the `find` command again to remove all directories using `-delete`.
With `-empty`, we ensure that we do not delete non-empty directories when something goes wrong.
The command also needs the `-depth` and `-mindepth 1` flags to recursively find the deepest directories first, as there are possible subdirectories in it and thus not empty.

```shell
find /path/to/directory -type d -depth -mindepth 1 -empty -delete
```

It will give us a directory with all files in the root and no subdirectories.

```
/path/to/directory
|-- file1.txt
|-- file2.txt
|-- file3.txt
|-- file4.txt
|-- file5.txt
|-- file6.txt
```

## Combining both

We can combine both commands to flatten a directory and clean it up in succession.
The following command is a combination of both steps at once.
Using `-o` means that `find` will only execute the second command if the first fails.

```shell
find /path/to/directory -mindepth 2 -type f -exec mv '{}' /path/to/directory \; \
  -o -type d -depth -mindepth 1 -empty -delete
```

[1]: https://man7.org/linux/man-pages/man1/find.1.html
[2]: https://man7.org/linux/man-pages/man1/mv.1.html
