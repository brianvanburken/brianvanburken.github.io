+++
title = "Match first of slice in Rust"
date = 2026-01-31
draft = true
+++


Display how to match with rest. Example is Rustlings "Advanced Errors 2"

match &v[..] {
            [first, ..] => true
            _ => false
        };
